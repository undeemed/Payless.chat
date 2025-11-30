import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      res.status(500).json({ error: 'Server configuration error', code: 'CONFIG_ERROR' });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email ?? '',
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed', code: 'AUTH_ERROR' });
  }
}

// Admin-only middleware (checks for admin role or service key)
export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // For now, we'll use a simple admin key check
  // In production, you'd want role-based access control
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_SECRET_KEY;

  if (!expectedKey) {
    res.status(500).json({ error: 'Admin key not configured', code: 'CONFIG_ERROR' });
    return;
  }

  if (adminKey !== expectedKey) {
    res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' });
    return;
  }

  next();
}

