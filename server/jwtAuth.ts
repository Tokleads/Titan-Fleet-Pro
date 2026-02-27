import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../shared/rbac';

const JWT_SECRET = process.env.SESSION_SECRET;
const JWT_EXPIRY = '24h';
const COOKIE_NAME = 'tf_token';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

if (!JWT_SECRET) {
  throw new Error('SESSION_SECRET environment variable must be set for JWT authentication');
}

const SECRET = JWT_SECRET;

export interface JwtPayload {
  userId: number;
  companyId: number;
  role: UserRole;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (req.cookies?.[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  return null;
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export function populateUser(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden', message: `Required role: ${roles.join(' or ')}` });
    }
    next();
  };
}

export function requireCompany(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const companyId = Number(req.params.companyId || req.query.companyId || req.body?.companyId);
  if (companyId && companyId !== req.user.companyId) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
  }
  next();
}
