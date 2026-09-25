import { Router, Response } from 'express';
import { adminDb, adminAuth, isConfigured } from '../firebaseAdmin.js';
import { authMiddleware, adminMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Helper to escape CSV cell content
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

// GET /api/admin/analytics - Platform performance and chart data from live Firestore
router.get('/analytics', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const { timeRange = 'all', category = 'all' } = req.query as { timeRange?: string; category?: string };

    const [eventsSnap, bookingsSnap, usersSnap, logsSnap] = await Promise.all([
      adminDb.collection('events').get(),
      adminDb.collection('bookings').get(),
      adminDb.collection('users').get(),
      adminDb.collection('activityLogs').orderBy('createdAt', 'desc').limit(25).get(),
    ]);

    const events = eventsSnap.docs.map((doc) => ({ eventId: doc.id, ...doc.data() }));
    const bookings = bookingsSnap.docs.map((doc) => ({ bookingId: doc.id, ...doc.data() }));
    const users = usersSnap.docs.map((doc) => ({ userId: doc.id, ...doc.data() }));
    const recentActivity = logsSnap.docs.map((doc) => ({ logId: doc.id, ...doc.data() }));

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter cutoffs for timeRange
    let filterDate: Date | null = null;
    const now = new Date();
    if (timeRange === 'today') {
      filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRange === '7d') {
      filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '90d') {
      filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    // Filtered bookings based on timeRange and category
    const filteredBookings = bookings.filter((b: any) => {
      if (category !== 'all' && b.eventCategory?.toLowerCase() !== category.toLowerCase()) {
        return false;
      }
      if (filterDate) {
        const bDate = new Date(b.bookedAt || b.createdAt || 0);
        if (bDate < filterDate) return false;
      }
      return true;
    });

    // 1. Event Level Metrics
    let publishedEvents = 0;
    let draftEvents = 0;
    let cancelledEvents = 0;
    let completedEvents = 0;
    let upcomingEvents = 0;
    let soldOutEvents = 0;
    let totalCapacity = 0;
    let remainingCapacity = 0;

    events.forEach((e: any) => {
      const status = e.status || 'published';
      if (status === 'published') publishedEvents++;
      else if (status === 'draft') draftEvents++;
      else if (status === 'cancelled') cancelledEvents++;
      else if (status === 'completed') completedEvents++;

      if (status === 'published' && e.availableSeats === 0) {
        soldOutEvents++;
      }

      if (e.date && e.date >= todayStr && status === 'published') {
        upcomingEvents++;
      }

      const cap = Number(e.capacity || 0);
      const avail = Number(e.availableSeats || 0);
      totalCapacity += cap;
      remainingCapacity += avail;
    });

    // 2. Booking Level Metrics
    let activeBookings = 0;
    let cancelledBookings = 0;
    let ticketsSold = 0;
    let simulatedBookingValue = 0;
    const userIdsWithBookings = new Set<string>();

    filteredBookings.forEach((b: any) => {
      if (b.userId) userIdsWithBookings.add(b.userId);
      if (b.status === 'confirmed') {
        activeBookings++;
        const q = Number(b.quantity || b.ticketsBooked || 0);
        const amount = Number(b.totalAmount || 0);
        ticketsSold += q;
        simulatedBookingValue += amount;
      } else if (b.status === 'cancelled') {
        cancelledBookings++;
      }
    });

    const totalBookings = filteredBookings.length;
    const avgTicketsPerBooking = activeBookings > 0 ? Number((ticketsSold / activeBookings).toFixed(1)) : 0;
    const avgBookingValue = activeBookings > 0 ? Math.round(simulatedBookingValue / activeBookings) : 0;
    const overallUtilization = totalCapacity > 0 ? Math.min(100, Math.round((ticketsSold / totalCapacity) * 100)) : 0;

    // 3. Category Breakdown (Aggregated from real events & bookings)
    const categoryMap: Record<string, { eventsCount: number; bookingsCount: number; ticketsSold: number; bookingValue: number }> = {};
    const ALL_CATEGORIES = ['Technology', 'Music', 'Business', 'Art', 'Sports', 'Workshop', 'Education', 'Conference'];

    ALL_CATEGORIES.forEach((c) => {
      categoryMap[c] = { eventsCount: 0, bookingsCount: 0, ticketsSold: 0, bookingValue: 0 };
    });

    events.forEach((e: any) => {
      const cat = e.category || 'Technology';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { eventsCount: 0, bookingsCount: 0, ticketsSold: 0, bookingValue: 0 };
      }
      categoryMap[cat].eventsCount++;
    });

    bookings.forEach((b: any) => {
      const cat = b.eventCategory || 'Technology';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { eventsCount: 0, bookingsCount: 0, ticketsSold: 0, bookingValue: 0 };
      }
      categoryMap[cat].bookingsCount++;
      if (b.status === 'confirmed') {
        categoryMap[cat].ticketsSold += Number(b.quantity || b.ticketsBooked || 0);
        categoryMap[cat].bookingValue += Number(b.totalAmount || 0);
      }
    });

    const categoryData = Object.entries(categoryMap).map(([name, stats]) => ({
      name,
      eventsCount: stats.eventsCount,
      bookingsCount: stats.bookingsCount,
      ticketsSold: stats.ticketsSold,
      bookingValue: stats.bookingValue,
      value: stats.eventsCount, // for fallback pie charts
    }));

    // 4. Booking Status Distribution
    const statusData = [
      {
        name: 'Confirmed',
        count: activeBookings,
        percentage: totalBookings > 0 ? Math.round((activeBookings / totalBookings) * 100) : 0,
      },
      {
        name: 'Cancelled',
        count: cancelledBookings,
        percentage: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0,
      },
    ];

    // 5. Booking trends aggregated by date
    const trendMap: Record<string, { date: string; bookings: number; tickets: number; bookingValue: number }> = {};
    filteredBookings.forEach((b: any) => {
      const dateStr = b.bookedAt ? b.bookedAt.split('T')[0] : (b.createdAt ? b.createdAt.split('T')[0] : 'Unknown');
      if (!trendMap[dateStr]) {
        trendMap[dateStr] = { date: dateStr, bookings: 0, tickets: 0, bookingValue: 0 };
      }
      trendMap[dateStr].bookings += 1;
      if (b.status === 'confirmed') {
        trendMap[dateStr].tickets += Number(b.quantity || b.ticketsBooked || 0);
        trendMap[dateStr].bookingValue += Number(b.totalAmount || 0);
      }
    });

    const bookingTrends = Object.values(trendMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 6. Event Performance Table Analytics
    const eventPerformance = events.map((e: any) => {
      const cap = Number(e.capacity || 0);
      const avail = Number(e.availableSeats || 0);
      const eventConfirmedBookings = bookings.filter((b: any) => b.eventId === e.eventId && b.status === 'confirmed');
      const eventTicketsSold = eventConfirmedBookings.reduce((sum: number, b: any) => sum + Number(b.quantity || b.ticketsBooked || 0), 0);
      const utilization = cap > 0 ? Math.min(100, Math.round((eventTicketsSold / cap) * 100)) : 0;
      const bookingValue = eventTicketsSold * Number(e.ticketPrice || 0);

      return {
        eventId: e.eventId,
        title: e.title || 'Untitled Event',
        category: e.category || 'Technology',
        date: e.date || '',
        time: e.time || '',
        venue: e.venue || '',
        status: e.status || 'published',
        capacity: cap,
        availableSeats: avail,
        ticketsSold: eventTicketsSold,
        utilization,
        ticketPrice: Number(e.ticketPrice || 0),
        bookingValue,
      };
    });

    res.json({
      metrics: {
        totalEvents: events.length,
        publishedEvents,
        draftEvents,
        cancelledEvents,
        completedEvents,
        upcomingEvents,
        soldOutEvents,
        totalCapacity,
        remainingCapacity,
        registeredUsers: users.length,
        usersWithBookings: userIdsWithBookings.size,
        totalBookings,
        activeBookings,
        cancelledBookings,
        ticketsSold,
        avgTicketsPerBooking,
        simulatedBookingValue,
        avgBookingValue,
        overallUtilization,
      },
      categoryData,
      statusData,
      bookingTrends,
      eventPerformance,
      recentActivity,
    });
  } catch (error: any) {
    console.error('Admin Analytics Error:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/admin/reports - Authoritative CSV generation
router.get('/reports', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const { type = 'bookings', category = 'all', status = 'all' } = req.query as { type?: string; category?: string; status?: string };

    // UTF-8 BOM for clean Excel / Numbers spreadsheet rendering
    const BOM = '\uFEFF';

    if (type === 'events') {
      const snapshot = await adminDb.collection('events').get();
      let events = snapshot.docs.map((doc) => ({ eventId: doc.id, ...doc.data() }));

      if (category !== 'all') {
        events = events.filter((e: any) => e.category?.toLowerCase() === category.toLowerCase());
      }
      if (status !== 'all') {
        events = events.filter((e: any) => e.status?.toLowerCase() === status.toLowerCase());
      }

      let csv = BOM + 'Event ID,Title,Category,Date,Time,Venue,Location,Capacity,Available Seats,Tickets Sold,Utilization (%),Ticket Price,Simulated Booking Value,Status,Created At\n';
      events.forEach((e: any) => {
        const cap = Number(e.capacity || 0);
        const avail = Number(e.availableSeats || 0);
        const sold = Math.max(0, cap - avail);
        const util = cap > 0 ? Math.round((sold / cap) * 100) : 0;
        const val = sold * Number(e.ticketPrice || 0);

        csv += [
          escapeCSV(e.eventId),
          escapeCSV(e.title),
          escapeCSV(e.category),
          escapeCSV(e.date),
          escapeCSV(e.time),
          escapeCSV(e.venue),
          escapeCSV(e.location),
          cap,
          avail,
          sold,
          `${util}%`,
          `$${e.ticketPrice || 0}`,
          `$${val}`,
          escapeCSV(e.status),
          escapeCSV(e.createdAt),
        ].join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=NEXORA-events-report.csv');
      res.send(csv);
      return;
    }

    if (type === 'users') {
      const [usersSnap, bookingsSnap] = await Promise.all([
        adminDb.collection('users').get(),
        adminDb.collection('bookings').get(),
      ]);

      const users = usersSnap.docs.map((doc) => ({ userId: doc.id, ...doc.data() }));
      const bookings = bookingsSnap.docs.map((doc) => doc.data());

      let csv = BOM + 'User ID,Full Name,Email,Role,Registered Date,Total Bookings,Active Bookings,Tickets Reserved,Simulated Booking Value\n';
      users.forEach((u: any) => {
        const userBookings = bookings.filter((b: any) => b.userId === u.userId);
        const activeBookings = userBookings.filter((b: any) => b.status === 'confirmed');
        const tickets = activeBookings.reduce((sum: number, b: any) => sum + Number(b.quantity || b.ticketsBooked || 0), 0);
        const val = activeBookings.reduce((sum: number, b: any) => sum + Number(b.totalAmount || 0), 0);

        csv += [
          escapeCSV(u.userId),
          escapeCSV(u.name),
          escapeCSV(u.email),
          escapeCSV(u.role),
          escapeCSV(u.createdAt),
          userBookings.length,
          activeBookings.length,
          tickets,
          `$${val}`,
        ].join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=NEXORA-users-report.csv');
      res.send(csv);
      return;
    }

    // Default: Bookings Report
    const snapshot = await adminDb.collection('bookings').get();
    let bookings = snapshot.docs.map((doc) => ({ bookingId: doc.id, ...doc.data() }));

    if (category !== 'all') {
      bookings = bookings.filter((b: any) => b.eventCategory?.toLowerCase() === category.toLowerCase());
    }
    if (status !== 'all') {
      bookings = bookings.filter((b: any) => b.status?.toLowerCase() === status.toLowerCase());
    }

    bookings.sort((a: any, b: any) => new Date(b.bookedAt || 0).getTime() - new Date(a.bookedAt || 0).getTime());

    let csv = BOM + 'Booking Reference,Event Title,Category,Attendee Name,Attendee Email,Tickets Reserved,Ticket Price,Total Amount (Simulated),Status,Booked Date,Updated Date\n';
    bookings.forEach((b: any) => {
      csv += [
        escapeCSV(b.bookingReference),
        escapeCSV(b.eventTitle),
        escapeCSV(b.eventCategory || 'Technology'),
        escapeCSV(b.userName),
        escapeCSV(b.userEmail),
        b.quantity || b.ticketsBooked || 1,
        `$${b.ticketPrice || 0}`,
        `$${b.totalAmount || 0}`,
        escapeCSV(b.status),
        escapeCSV(b.bookedAt),
        escapeCSV(b.updatedAt || b.bookedAt),
      ].join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=NEXORA-bookings-report.csv');
    res.send(csv);
  } catch (error: any) {
    console.error('Report Generation Error:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/admin/users - List all users
router.get('/users', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const snapshot = await adminDb.collection('users').get();
    const users = snapshot.docs.map((doc) => doc.data());
    res.json({ users, count: users.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/admin/bookings - List all bookings
router.get('/bookings', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const snapshot = await adminDb.collection('bookings').get();
    const bookings = snapshot.docs.map((doc) => doc.data());
    bookings.sort((a: any, b: any) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
    res.json({ bookings, count: bookings.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/admin/activity - List platform audit logs
router.get('/activity', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const snapshot = await adminDb
      .collection('activityLogs')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    const logs = snapshot.docs.map((doc) => ({
      logId: doc.id,
      ...doc.data(),
    }));

    res.json({ logs });
  } catch (error: any) {
    console.error('Admin activity logs error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/admin/notifications - List all platform notifications across users
router.get('/notifications', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const [notifsSnap, usersSnap, eventsSnap] = await Promise.all([
      adminDb.collection('notifications').get(),
      adminDb.collection('users').get(),
      adminDb.collection('events').get(),
    ]);

    const usersMap = new Map<string, any>();
    usersSnap.docs.forEach((d) => usersMap.set(d.id, d.data()));

    const eventsMap = new Map<string, any>();
    eventsSnap.docs.forEach((d) => eventsMap.set(d.id, d.data()));

    const notifications = notifsSnap.docs.map((doc) => {
      const data = doc.data();
      const user = data.userId ? usersMap.get(data.userId) : null;
      const event = data.eventId ? eventsMap.get(data.eventId) : null;

      return {
        notificationId: doc.id,
        ...data,
        userName: data.userName || user?.name || 'Attendee',
        userEmail: data.userEmail || user?.email || '',
        eventTitle: data.eventTitle || event?.title || '',
      };
    });

    notifications.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    res.json({
      notifications,
      count: notifications.length,
      unreadCount: notifications.filter((n: any) => !n.read).length,
    });
  } catch (error: any) {
    console.error('Admin notifications error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT /api/admin/notifications/:id/read - Mark notification as read (Admin)
router.put('/notifications/:id/read', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const notifId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const notifRef = adminDb.collection('notifications').doc(notifId);
    const doc = await notifRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Not Found', message: 'Notification not found' });
      return;
    }

    await notifRef.update({ read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT /api/admin/notifications/mark-all-read - Mark all notifications as read (Admin)
router.put('/notifications/mark-all-read', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const unreadSnap = await adminDb.collection('notifications').where('read', '==', false).get();
    const batch = adminDb.batch();

    unreadSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    res.json({ message: 'All notifications marked as read', updatedCount: unreadSnap.size });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/admin/admins - List all authorized administrators
router.get('/admins', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb || !adminAuth) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const adminDocs = await adminDb.collection('users').where('role', '==', 'admin').get();

    const adminList = await Promise.all(
      adminDocs.docs.map(async (doc) => {
        const data = doc.data();
        let authUser: any = null;
        try {
          authUser = await adminAuth!.getUser(doc.id);
        } catch (e) {
          // Fallback if not found in auth directly
        }

        return {
          userId: doc.id,
          name: data.name || authUser?.displayName || 'Administrator',
          email: data.email || authUser?.email || '',
          role: 'admin',
          profileImage: data.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name || doc.id)}`,
          createdAt: data.createdAt || authUser?.metadata?.creationTime || new Date().toISOString(),
          lastSignInTime: authUser?.metadata?.lastSignInTime || null,
          disabled: Boolean(authUser?.disabled),
        };
      })
    );

    adminList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      admins: adminList,
      count: adminList.length,
    });
  } catch (error: any) {
    console.error('List admins error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/admin/admins - Create additional administrator account (Admin Only)
router.post('/admins', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb || !adminAuth) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Bad Request', message: 'Full Name is required.' });
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Bad Request', message: 'Valid Email address is required.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Bad Request', message: 'Password must be at least 6 characters long.' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    // Check if user already exists in Firebase Auth
    try {
      const existingUser = await adminAuth.getUserByEmail(trimmedEmail);
      if (existingUser) {
        res.status(409).json({
          error: 'Conflict',
          message: 'An account with this email address already exists.',
        });
        return;
      }
    } catch (err: any) {
      if (err.code !== 'auth/user-not-found') {
        throw err;
      }
    }

    // 1. Create Firebase Auth user
    const newUserRecord = await adminAuth.createUser({
      email: trimmedEmail,
      password,
      displayName: trimmedName,
      emailVerified: true,
    });

    // 2. Set Custom User Claims for role: admin
    await adminAuth.setCustomUserClaims(newUserRecord.uid, {
      role: 'admin',
      admin: true,
    });

    // 3. Create Firestore user document with role: 'admin'
    const newAdminData = {
      userId: newUserRecord.uid,
      name: trimmedName,
      email: trimmedEmail,
      role: 'admin',
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmedName)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user!.uid,
    };

    await adminDb.collection('users').doc(newUserRecord.uid).set(newAdminData);

    // 4. Log to activity logs
    await adminDb.collection('activityLogs').add({
      userId: req.user!.uid,
      action: 'ADMIN_CREATED',
      details: {
        createdAdminUid: newUserRecord.uid,
        createdAdminEmail: trimmedEmail,
        createdAdminName: trimmedName,
      },
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'Admin account created successfully.',
      admin: {
        userId: newUserRecord.uid,
        name: trimmedName,
        email: trimmedEmail,
        role: 'admin',
        createdAt: newAdminData.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Create Admin Error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

export default router;
