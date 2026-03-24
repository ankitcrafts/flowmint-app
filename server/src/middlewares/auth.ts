import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// CRITICAL: No fallback — crash if JWT_SECRET is not set
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('\n🚨 FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}
if (JWT_SECRET.length < 64) {
  console.error('\n🚨 FATAL: JWT_SECRET is too short (minimum 64 characters).');
  process.exit(1);
}

const JWT_VERIFY_OPTIONS: jwt.VerifyOptions = {
  algorithms: ['HS256'],
  issuer: 'flowmint-server',
  audience: 'flowmint-app',
};

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, JWT_VERIFY_OPTIONS) as any;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired — use /auth/refresh' });
    }
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

