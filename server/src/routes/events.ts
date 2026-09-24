import { Router, Response } from 'express';
import { adminDb, isConfigured } from '../firebaseAdmin.js';
import { authMiddleware, adminMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/events - Public list with search, category, status, featured, and sort query parameters
router.get('/', async (req, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin is not configured.' });
    return;
  }

  try {
    const { category, search, status = 'published', featured, sort = 'date-asc' } = req.query;

    let query: FirebaseFirestore.Query = adminDb.collection('events');

    if (status !== 'all') {
      query = query.where('status', '==', status as string);
    }

    if (category && category !== 'All') {
      query = query.where('category', '==', category as string);
    }

    if (featured === 'true') {
      query = query.where('featured', '==', true);
    }

    const snapshot = await query.get();
    let events = snapshot.docs.map((doc) => ({
      eventId: doc.id,
      ...doc.data(),
    }));

    // Search text filter
    if (search && typeof search === 'string') {
      const term = search.toLowerCase();
      events = events.filter(
        (e: any) =>
          e.title?.toLowerCase().includes(term) ||
          e.description?.toLowerCase().includes(term) ||
          e.venue?.toLowerCase().includes(term) ||
          e.location?.toLowerCase().includes(term) ||
          e.city?.toLowerCase().includes(term)
      );
    }

    // Sort
    events.sort((a: any, b: any) => {
      if (sort === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sort === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sort === 'price-asc') return (a.ticketPrice || 0) - (b.ticketPrice || 0);
      if (sort === 'price-desc') return (b.ticketPrice || 0) - (a.ticketPrice || 0);
      return 0;
    });

    res.json({ events, count: events.length });
  } catch (error: any) {
    console.error('Fetch Events Error:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/events/:id - Public event detail
router.get('/:id', async (req, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin is not configured.' });
    return;
  }

  try {
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const doc = await adminDb.collection('events').doc(docId).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Not Found', message: 'Event not found' });
      return;
    }

    res.json({ eventId: doc.id, ...doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/events - Protected (Admin only)
router.post('/', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin is not configured.' });
    return;
  }

  try {
    const {
      title,
      description,
      category,
      bannerImage,
      date,
      time,
      startTime,
      endTime,
      venue,
      location,
      city,
      capacity,
      ticketPrice,
      status = 'published',
      featured = false,
    } = req.body;

    // Strict Server-Side Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Bad Request', message: 'Event title is required.' });
      return;
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      res.status(400).json({ error: 'Bad Request', message: 'Event description is required.' });
      return;
    }

    if (!category || typeof category !== 'string') {
      res.status(400).json({ error: 'Bad Request', message: 'Event category is required.' });
      return;
    }

    if (!date || isNaN(Date.parse(date))) {
      res.status(400).json({ error: 'Bad Request', message: 'A valid event date (YYYY-MM-DD) is required.' });
      return;
    }

    if (!venue || typeof venue !== 'string' || !venue.trim()) {
      res.status(400).json({ error: 'Bad Request', message: 'Venue name is required.' });
      return;
    }

    const capacityNum = Number(capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Total capacity must be a positive number greater than 0.' });
      return;
    }

    const priceNum = Number(ticketPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Ticket price cannot be negative.' });
      return;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const newEvent = {
      title: title.trim(),
      slug,
      description: description.trim(),
      category,
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      date,
      time: time || startTime || '09:00 AM',
      startTime: startTime || time || '09:00 AM',
      endTime: endTime || '05:00 PM',
      venue: venue.trim(),
      location: location || venue,
      city: city || location || venue,
      organizerId: req.user!.uid,
      organizerName: req.user!.name || 'NEXORA Admin',
      capacity: capacityNum,
      availableSeats: capacityNum,
      ticketPrice: priceNum,
      status,
      featured: Boolean(featured),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user!.uid,
    };

    const docRef = await adminDb.collection('events').add(newEvent);

    // Audit Log
    await adminDb.collection('activityLogs').add({
      userId: req.user!.uid,
      action: 'EVENT_CREATED',
      details: { eventId: docRef.id, title: newEvent.title },
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ eventId: docRef.id, ...newEvent });
  } catch (error: any) {
    console.error('Create Event Error:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT /api/events/:id - Protected (Admin only) with BOOKING CAPACITY SAFETY CHECK
router.put('/:id', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin is not configured.' });
    return;
  }

  try {
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const eventRef = adminDb.collection('events').doc(docId);
    const doc = await eventRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Not Found', message: 'Event not found' });
      return;
    }

    const existingData = doc.data()!;
    const ticketsBooked = existingData.capacity - existingData.availableSeats;

    const updateData: any = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    // Capacity Change Validation & Safety Logic
    if (req.body.capacity !== undefined) {
      const newCap = Number(req.body.capacity);
      if (isNaN(newCap) || newCap <= 0) {
        res.status(400).json({ error: 'Bad Request', message: 'Capacity must be greater than 0.' });
        return;
      }

      if (newCap < ticketsBooked) {
        res.status(400).json({
          error: 'Bad Request',
          message: `Cannot decrease capacity to ${newCap}. ${ticketsBooked} ticket(s) are already booked for this event.`,
        });
        return;
      }

      updateData.capacity = newCap;
      updateData.availableSeats = newCap - ticketsBooked;
    }

    if (req.body.ticketPrice !== undefined) {
      const priceNum = Number(req.body.ticketPrice);
      if (isNaN(priceNum) || priceNum < 0) {
        res.status(400).json({ error: 'Bad Request', message: 'Ticket price cannot be negative.' });
        return;
      }
      updateData.ticketPrice = priceNum;
    }

    await eventRef.update(updateData);

    // If event was marked as cancelled, notify all attendees with confirmed bookings
    if (req.body.status === 'cancelled' && existingData.status !== 'cancelled') {
      try {
        const firestoreAdminDb = adminDb;
        if (firestoreAdminDb) {
          const bookingsSnap = await firestoreAdminDb
            .collection('bookings')
            .where('eventId', '==', docId)
            .where('status', '==', 'confirmed')
            .get();

          if (!bookingsSnap.empty) {
            const batch = firestoreAdminDb.batch();
            const notifiedUsers = new Set<string>();

            bookingsSnap.docs.forEach((bDoc) => {
              const bData = bDoc.data();
              if (bData.userId && !notifiedUsers.has(bData.userId)) {
                notifiedUsers.add(bData.userId);
                const notifRef = firestoreAdminDb.collection('notifications').doc();
                batch.set(notifRef, {
                  notificationId: notifRef.id,
                  userId: bData.userId,
                  title: 'Event Cancelled',
                  message: `"${existingData.title}" scheduled for ${existingData.date} has been cancelled by the organizer.`,
                  type: 'event_cancelled',
                  eventId: docId,
                  bookingId: bData.bookingId,
                  read: false,
                  createdAt: new Date().toISOString(),
                });
              }
            });

            await batch.commit();
          }
        }
      } catch (notifErr) {
        console.error('Failed to dispatch event cancellation notifications:', notifErr);
      }
    }

    // Audit log
    await adminDb.collection('activityLogs').add({
      userId: req.user!.uid,
      action: 'EVENT_UPDATED',
      details: { eventId: docId, updates: Object.keys(req.body) },
      createdAt: new Date().toISOString(),
    });

    res.json({ message: 'Event updated successfully', eventId: docId });
  } catch (error: any) {
    console.error('Update Event Error:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// DELETE /api/events/:id - Protected (Admin only) with BOOKING EXISTENCE SAFETY CHECK
router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin is not configured.' });
    return;
  }

  try {
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const eventRef = adminDb.collection('events').doc(docId);
    const doc = await eventRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Not Found', message: 'Event not found' });
      return;
    }

    // Safety Check: Query existing bookings for this event
    const bookingsSnap = await adminDb.collection('bookings').where('eventId', '==', docId).get();
    if (!bookingsSnap.empty) {
      res.status(400).json({
        error: 'Conflict',
        message: `Cannot delete event because ${bookingsSnap.size} booking(s) exist for it. Please change the event status to 'cancelled' or 'draft' instead.`,
      });
      return;
    }

    await eventRef.delete();

    // Audit log
    await adminDb.collection('activityLogs').add({
      userId: req.user!.uid,
      action: 'EVENT_DELETED',
      details: { eventId: docId, title: doc.data()?.title },
      createdAt: new Date().toISOString(),
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Delete Event Error:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

export default router;
