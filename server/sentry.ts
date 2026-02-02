/**
 * Sentry Configuration for Backend
 * 
 * Error tracking and performance monitoring for production.
 * 
 * Setup Instructions:
 * 1. Create a Sentry project at https://sentry.io
 * 2. Get your DSN from Project Settings > Client Keys (DSN)
 * 3. Set SENTRY_DSN environment variable
 * 4. Restart the server
 */

import * as Sentry from "@sentry/node";
import { Express } from "express";

/**
 * Initialize Sentry for error tracking
 */
export function initSentry(app: Express) {
  const dsn = process.env.SENTRY_DSN;
  
  // Only initialize if DSN is provided
  if (!dsn) {
    console.log('[Sentry] Not initialized - SENTRY_DSN not set');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Integrations
    integrations: [
      // HTTP integration for tracking API calls
      Sentry.httpIntegration(),
    ],
    
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      
      // Remove sensitive data from request body
      if (event.request?.data) {
        const data = event.request.data as any;
        if (typeof data === 'object') {
          delete data.password;
          delete data.pin;
          delete data.token;
        }
      }
      
      return event;
    },
  });

  console.log('[Sentry] Initialized successfully');
}

/**
 * Sentry middleware (not used in current version)
 * Sentry 10.x uses different integration approach
 */

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message manually
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Add user context to Sentry
 */
export function setUser(user: { id: number; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id.toString(),
    email: user.email,
    role: user.role,
  });
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null);
}
