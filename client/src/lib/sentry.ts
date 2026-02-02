/**
 * Sentry Configuration for Frontend
 * 
 * Error tracking and performance monitoring for production.
 * 
 * Setup Instructions:
 * 1. Create a Sentry project at https://sentry.io
 * 2. Get your DSN from Project Settings > Client Keys (DSN)
 * 3. Set VITE_SENTRY_DSN environment variable
 * 4. Rebuild the frontend
 */

import * as Sentry from "@sentry/react";
import { useEffect } from "react";

/**
 * Initialize Sentry for error tracking
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  // Only initialize if DSN is provided
  if (!dsn) {
    console.log('[Sentry] Not initialized - VITE_SENTRY_DSN not set');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Session replay (optional - captures user sessions for debugging)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    integrations: [
      // React integration for component errors
      Sentry.browserTracingIntegration(),
      // Session replay
      Sentry.replayIntegration({
        maskAllText: true, // Mask all text for privacy
        blockAllMedia: true, // Block all media for privacy
      }),
    ],
    
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            delete breadcrumb.data.password;
            delete breadcrumb.data.pin;
            delete breadcrumb.data.token;
          }
          return breadcrumb;
        });
      }
      
      return event;
    },
  });

  console.log('[Sentry] Initialized successfully');
}

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

/**
 * Create an ErrorBoundary component
 */
export const ErrorBoundary = Sentry.ErrorBoundary;
