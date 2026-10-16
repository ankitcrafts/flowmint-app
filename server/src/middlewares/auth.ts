import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authorization.slice('Bearer '.length);
  void supabase.auth.getUser(token).then(({ data, error }) => {
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.full_name || data.user.email || '',
    };
    next();
  }).catch((error: unknown) => {
    console.error('Supabase session verification failed:', error);
    res.status(401).json({ error: 'Unable to verify session' });
  });
};
