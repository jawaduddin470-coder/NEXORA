import { Router, Response } from 'express';
import { adminDb, isConfigured } from '../firebaseAdmin.js';
import { authMiddleware, adminMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/upload - Upload event banner image (Protected - Admin only)
router.post('/', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).json({ error: 'Service Unavailable', message: 'Firebase Admin is not configured.' });
    return;
  }

  try {
    const { base64, contentType = 'image/jpeg', fileName = 'banner.jpg' } = req.body;

    if (!base64 || typeof base64 !== 'string') {
      res.status(400).json({ error: 'Bad Request', message: 'Image base64 data is required.' });
      return;
    }

    // Strip any data URI scheme header if included
    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');

    // Validate size (max 900 KB decoded to stay comfortably under 1MB Firestore limit)
    const byteLength = Buffer.byteLength(cleanBase64, 'base64');
    if (byteLength > 900 * 1024) {
      res.status(400).json({
        error: 'Payload Too Large',
        message: `Image size (${(byteLength / 1024).toFixed(0)} KB) exceeds the maximum allowed size (900 KB). Please select an image under 900 KB or provide an image URL.`,
      });
      return;
    }

    const docRef = await adminDb.collection('eventImages').add({
      base64: cleanBase64,
      contentType: contentType || 'image/jpeg',
      fileName: fileName.replace(/[^a-zA-Z0-9._-]/g, '_'),
      size: byteLength,
      uploadedBy: req.user!.uid,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      url: `/api/images/${docRef.id}`,
      id: docRef.id,
      size: byteLength,
    });
  } catch (err: any) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message || 'Failed to save image.' });
  }
});

export default router;
