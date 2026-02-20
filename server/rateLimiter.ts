import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import type { Request } from 'express';

const keyGenerator = (req: Request): string => {
  const userId = (req as any).user?.id;
  if (userId) return `user-${userId}`;
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';
  return `ip-${ip}`;
};

const ipKeyGenerator = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';
  return ip;
};

export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP/user, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  validate: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => `auth-${ipKeyGenerator(req)}`,
  validate: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  validate: false,
});

export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many report generation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  validate: false,
});

export const gpsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 720,
  message: 'Too many GPS updates, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  validate: false,
});

export const broadcastLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many broadcast notifications, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const companyId = (req as any).user?.companyId;
    return companyId ? `company-${companyId}` : keyGenerator(req);
  },
  validate: false,
});

export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500,
  maxDelayMs: 5000,
  keyGenerator,
  validate: false,
});

export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => `public-${ipKeyGenerator(req)}`,
  validate: false,
});

export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  validate: false,
});

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many write requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  validate: false,
});
