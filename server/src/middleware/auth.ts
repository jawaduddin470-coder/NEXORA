import { Request, Response, NextFunction } from 'express';
import { adminAuth, adminDb, isConfigured } from '../firebaseAdmin.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    name?: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!isConfigured || !adminAuth || !adminDb) {
    res.status(503).json({
      error: 'Backend Service Unavailable',
      message: 'Firebase Admin SDK is not configured in server environment variables.',
    });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      res.status(401).json({ error: 'Unauthorized', message: 'User record not found in Firestore' });
      return;
    }

    const userData = userDoc.data();
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: (decodedToken.role as string) || userData?.role || 'user',
      name: userData?.name || decodedToken.name || 'User',
    };

    next();
  } catch (error: any) {
    console.error('Auth Verification Error:', error.message);
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired authentication token' });
  }
};

export const adminMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Admin role privileges required for this operation' });
    return;
  }

  next();
};
