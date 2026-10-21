import { Router, Request, Response } from 'express';
import { adminDb, isConfigured } from '../firebaseAdmin.js';

const router = Router();

// GET /api/images/:id - Public image streaming endpoint with aggressive browser caching
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  if (!isConfigured || !adminDb) {
    res.status(503).send('Storage service temporarily unavailable');
    return;
  }

  try {
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const doc = await adminDb.collection('eventImages').doc(docId).get();

    if (!doc.exists) {
      res.status(404).send('Image not found');
      return;
    }

    const data = doc.data()!;
    const buffer = Buffer.from(data.base64, 'base64');

    res.setHeader('Content-Type', data.contentType || 'image/jpeg');
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (err: any) {
    console.error('Error serving image:', err);
    res.status(500).send('Error loading image');
  }
});

export default router;
