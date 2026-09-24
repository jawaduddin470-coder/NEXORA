import { Router, Response } from 'express';
import { adminDb, isConfigured } from '../firebaseAdmin.js';
import { authMiddleware, adminMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Helper to generate unique human-readable booking reference code (e.g. NX-2026-9A2F8B)
function generateBookingReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomCode = '';
  for (let i = 0; i < 6; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NX-2026-${randomCode}`;
}

// POST /api/bookings - Atomic Firestore transaction for seat reservation
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const userId = req.user!.uid;
    const { eventId, quantity, attendeeDetails, idempotencyKey } = req.body;

    // Standard structural validation
    if (!eventId || !quantity || typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      res.status(400).json({ error: 'Bad Request', message: 'Ticket quantity must be a valid positive integer.' });
      return;
    }

    // Idempotency check: prevent duplicate submissions on retries
    if (idempotencyKey && typeof idempotencyKey === 'string') {
      const existingSnap = await adminDb
        .collection('bookings')
        .where('userId', '==', userId)
        .where('idempotencyKey', '==', idempotencyKey)
        .limit(1)
        .get();

      if (!existingSnap.empty) {
        const existingBooking = existingSnap.docs[0].data();
        res.status(200).json({
          message: 'Booking already confirmed (idempotent request)',
          booking: existingBooking,
        });
        return;
      }
    }

    const eventRef = adminDb.collection('events').doc(eventId);
    const bookingRefDoc = adminDb.collection('bookings').doc();
    const notificationRefDoc = adminDb.collection('notifications').doc();
    const bookingReference = generateBookingReference();

    // Execute atomic Firestore transaction
    const transactionResult = await adminDb.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists) {
        throw new Error('EVENT_NOT_FOUND');
      }

      const eventData = eventDoc.data()!;
      if (eventData.status !== 'published') {
        throw new Error('EVENT_NOT_AVAILABLE');
      }

      if (eventData.availableSeats < quantity) {
        throw new Error('INSUFFICIENT_SEATS');
      }

      const newAvailableSeats = eventData.availableSeats - quantity;
      const totalAmount = eventData.ticketPrice * quantity;
      const nowIso = new Date().toISOString();

      // 1. Decrement available seats on event
      transaction.update(eventRef, {
        availableSeats: newAvailableSeats,
        updatedAt: nowIso,
      });

      // 2. Create booking document
      const bookingData = {
        bookingId: bookingRefDoc.id,
        bookingReference,
        userId,
        userName: req.user!.name || req.user!.email || 'Guest User',
        userEmail: req.user!.email || '',
        eventId,
        eventTitle: eventData.title,
        eventCategory: eventData.category,
        eventBannerImage: eventData.bannerImage,
        eventDate: eventData.date,
        eventTime: eventData.time,
        eventVenue: eventData.venue,
        eventLocation: eventData.location,
        quantity,
        ticketsBooked: quantity,
        ticketPrice: eventData.ticketPrice,
        attendeeDetails: attendeeDetails || [{ name: req.user!.name, email: req.user!.email }],
        totalAmount,
        status: 'confirmed',
        idempotencyKey: idempotencyKey || null,
        bookedAt: nowIso,
        updatedAt: nowIso,
      };
      transaction.set(bookingRefDoc, bookingData);

      // 3. Create notification document
      const notificationData = {
        notificationId: notificationRefDoc.id,
        userId,
        title: 'Booking Confirmed!',
        message: `Your reservation (${bookingReference}) for "${eventData.title}" (${quantity} ticket(s)) has been confirmed.`,
        type: 'booking_confirmation',
        read: false,
        createdAt: nowIso,
      };
      transaction.set(notificationRefDoc, notificationData);

      return bookingData;
    });

    // Log user activity
    await adminDb.collection('activityLogs').add({
      userId,
      action: 'TICKETS_BOOKED',
      details: {
        bookingId: transactionResult.bookingId,
        bookingReference,
        eventId,
        quantity,
      },
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'Booking confirmed successfully',
      booking: transactionResult,
    });
  } catch (error: any) {
    console.error('Booking Transaction Failed:', error.message);
    if (error.message === 'EVENT_NOT_FOUND') {
      res.status(404).json({ error: 'Not Found', message: 'The specified event does not exist.' });
    } else if (error.message === 'EVENT_NOT_AVAILABLE') {
      res.status(400).json({ error: 'Bad Request', message: 'This event is no longer available for booking.' });
    } else if (error.message === 'INSUFFICIENT_SEATS') {
      res.status(409).json({
        error: 'Conflict',
        message: 'These tickets were just booked by another attendee. Please choose a smaller quantity.',
      });
    } else {
      res.status(500).json({ error: 'Server Error', message: error.message || 'Booking transaction failed' });
    }
  }
});

// POST /api/bookings/:id/cancel - Safe Atomic Cancellation & Seat Restoration
router.post('/:id/cancel', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.uid;

    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      res.status(404).json({ error: 'Not Found', message: 'Booking reservation not found.' });
      return;
    }

    const bookingData = bookingDoc.data()!;

    // Verify ownership or admin role
    if (bookingData.userId !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to cancel this booking.' });
      return;
    }

    // Verify status
    if (bookingData.status !== 'confirmed') {
      res.status(400).json({ error: 'Bad Request', message: `Booking cannot be cancelled because its current status is '${bookingData.status}'.` });
      return;
    }

    const notificationRefDoc = adminDb.collection('notifications').doc();
    const eventRef = adminDb.collection('events').doc(bookingData.eventId);
    const nowIso = new Date().toISOString();

    // Execute atomic cancellation transaction
    const updatedBooking = await adminDb.runTransaction(async (transaction) => {
      const currentBookingSnap = await transaction.get(bookingRef);
      if (!currentBookingSnap.exists) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      const currentBooking = currentBookingSnap.data()!;
      if (currentBooking.status !== 'confirmed') {
        throw new Error('ALREADY_CANCELLED');
      }

      const eventSnap = await transaction.get(eventRef);
      if (eventSnap.exists) {
        const eventData = eventSnap.data()!;
        const restoredSeats = eventData.availableSeats + currentBooking.quantity;
        transaction.update(eventRef, {
          availableSeats: restoredSeats,
          updatedAt: nowIso,
        });
      }

      // 1. Update booking status
      transaction.update(bookingRef, {
        status: 'cancelled',
        updatedAt: nowIso,
      });

      // 2. Create in-app notification
      transaction.set(notificationRefDoc, {
        notificationId: notificationRefDoc.id,
        userId: currentBooking.userId,
        title: 'Booking Cancelled',
        message: `Your reservation (${currentBooking.bookingReference}) for "${currentBooking.eventTitle}" has been cancelled and your seats restored.`,
        type: 'event_update',
        read: false,
        createdAt: nowIso,
      });

      return {
        ...currentBooking,
        status: 'cancelled',
        updatedAt: nowIso,
      };
    });

    // Log activity
    await adminDb.collection('activityLogs').add({
      userId,
      action: 'BOOKING_CANCELLED',
      details: {
        bookingId,
        bookingReference: bookingData.bookingReference,
        eventId: bookingData.eventId,
        quantityRestored: bookingData.quantity,
      },
      createdAt: nowIso,
    });

    res.json({
      message: 'Booking cancelled successfully and seat inventory restored.',
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error('Booking Cancellation Error:', error.message);
    if (error.message === 'ALREADY_CANCELLED') {
      res.status(400).json({ error: 'Bad Request', message: 'This booking has already been cancelled.' });
    } else {
      res.status(500).json({ error: 'Server Error', message: error.message || 'Failed to cancel booking.' });
    }
  }
});

// GET /api/bookings/my - Fetch authenticated user's bookings
router.get('/my', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const snapshot = await adminDb
      .collection('bookings')
      .where('userId', '==', req.user!.uid)
      .get();

    const bookings = snapshot.docs.map((doc) => doc.data());
    // Sort descending by bookedAt
    bookings.sort((a: any, b: any) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());

    res.json({ bookings });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/bookings/:id - Fetch single booking detail
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const doc = await adminDb.collection('bookings').doc(docId).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Not Found', message: 'Booking not found' });
      return;
    }

    const booking = doc.data()!;
    if (booking.userId !== req.user!.uid && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
      return;
    }

    res.json({ booking });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/bookings/event/:eventId - Fetch all bookings for a specific event (Admin only)
router.get('/event/:eventId', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const evtId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const snapshot = await adminDb
      .collection('bookings')
      .where('eventId', '==', evtId)
      .get();

    const bookings = snapshot.docs.map((doc) => doc.data());
    res.json({ bookings, count: bookings.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

export default router;
