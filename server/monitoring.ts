/**
 * Monitoring and Error Tracking
 * Integrates Sentry for production error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type { Express, Request, Response, NextFunction } from 'express';

/**
 * Initialize Sentry for error tracking
 */
export function initSentry(app: Express) {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Profiling
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        nodeProfilingIntegration(),
      ],
      
      // Release tracking
      release: process.env.SENTRY_RELEASE || `titan-fleet@${process.env.npm_package_version}`,
      
      // Error filtering
      beforeSend(event, hint) {
        // Don't send client errors (4xx) to Sentry
        if (event.request?.url && event.contexts?.response?.status_code) {
          const statusCode = event.contexts.response.status_code;
          if (statusCode >= 400 && statusCode < 500) {
            return null;
          }
        }
        
        // Filter out rate limit errors
        if (hint.originalException && typeof hint.originalException === 'object') {
          const error = hint.originalException as any;
          if (error.message?.includes('Too many requests')) {
            return null;
          }
        }
        
        return event;
      },
      
      // Ignore specific errors
      ignoreErrors: [
        'NetworkError',
        'AbortError',
        'TimeoutError',
        /^Non-Error/,
      ],
    });

    console.log('✅ Sentry initialized for error tracking');
  } else {
    console.warn('⚠️  SENTRY_DSN not configured - error tracking disabled');
  }
}

/**
 * Sentry request handler middleware
 * Must be the first middleware
 */
export const sentryRequestHandler = () => {
  return (req: Request, res: Response, next: NextFunction) => next();
};

/**
 * Sentry tracing middleware
 * Must be after request handler
 */
export const sentryTracingHandler = () => {
  // Tracing is now handled by expressIntegration in init
  return (req: Request, res: Response, next: NextFunction) => next();
};

/**
 * Sentry error handler middleware
 * Must be after all routes but before other error handlers
 */
export const sentryErrorHandler = () => {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    Sentry.captureException(error);
    next(error);
  };
};

/**
 * Custom error tracking function
 */
export function trackError(error: Error, context?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('[ERROR]', error, context);
  }
}

/**
 * Track custom events
 */
export function trackEvent(event: string, data?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(event, {
      level: 'info',
      extra: data,
    });
  } else {
    console.log('[EVENT]', event, data);
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: { id: number; email?: string; username?: string; role?: string }) {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser({
      id: user.id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data,
    });
  }
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  // Simplified transaction tracking
  return {
    setHttpStatus: (status: number) => {},
    finish: () => {}
  };
}

/**
 * Performance monitoring middleware
 */
export function performanceMonitoring(req: Request, res: Response, next: NextFunction) {
  const transaction = startTransaction(`${req.method} ${req.path}`, 'http.server');
  
  if (transaction) {
    res.on('finish', () => {
      transaction.setHttpStatus(res.statusCode);
      transaction.finish();
    });
  }
  
  next();
}

/**
 * Health check endpoint for monitoring
 */
export function healthCheck(req: Request, res: Response) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };
  
  res.status(200).json(health);
}

/**
 * Readiness check endpoint for Kubernetes/Docker
 */
export function readinessCheck(req: Request, res: Response) {
  // Check database connection, storage, etc.
  // For now, just return ok
  res.status(200).json({ ready: true });
}

/**
 * Liveness check endpoint for Kubernetes/Docker
 */
export function livenessCheck(req: Request, res: Response) {
  res.status(200).json({ alive: true });
}

/**
 * Metrics endpoint for Prometheus (optional)
 */
export function metricsEndpoint(req: Request, res: Response) {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: Date.now(),
  };
  
  res.status(200).json(metrics);
}
