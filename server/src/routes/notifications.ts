import { Router, Response } from 'express';
import { adminDb, isConfigured } from '../firebaseAdmin.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications - User notification history
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin SDK is not configured.' });
    return;
  }

  try {
    const snapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', req.user!.uid)
      .get();

    const notifications = snapshot.docs.map((doc) => doc.data());
    notifications.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ notifications, unreadCount: notifications.filter((n: any) => !n.read).length });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT /api/notifications/:id/read - Toggle read status
router.put('/:id/read', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    if (doc.data()?.userId !== req.user!.uid) {
      res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
      return;
    }

    await notifRef.update({ read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

export default router;
