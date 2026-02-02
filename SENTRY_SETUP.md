# Sentry Error Tracking Setup

Sentry is configured and ready to use for production error tracking and performance monitoring.

## What is Sentry?

Sentry is a real-time error tracking platform that helps you:
- **Monitor errors** in production
- **Track performance** issues
- **Replay user sessions** to understand bugs
- **Get alerts** when critical errors occur
- **Analyze trends** over time

## Setup Instructions

### 1. Create a Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account (10,000 errors/month free)
3. Create a new project:
   - Choose **Node.js** for backend
   - Choose **React** for frontend

### 2. Get Your DSN

After creating projects, you'll get two DSNs (Data Source Names):

1. **Backend DSN**: From your Node.js project settings
2. **Frontend DSN**: From your React project settings

The DSN looks like: `https://[key]@o[org].ingest.sentry.io/[project]`

### 3. Configure Environment Variables

Add these to your environment variables (or `.env` file):

```bash
# Backend Sentry DSN
SENTRY_DSN=https://your-backend-dsn-here

# Frontend Sentry DSN (must start with VITE_)
VITE_SENTRY_DSN=https://your-frontend-dsn-here
```

### 4. Restart Your Application

```bash
# Restart the server
pnpm run dev
```

### 5. Test the Integration

**Backend Test:**
```bash
curl http://localhost:3000/api/test-sentry-error
```

**Frontend Test:**
- Open the app
- Trigger an error (e.g., click a broken button)
- Check Sentry dashboard for the error

## Features Enabled

### Backend
- ✅ Automatic error tracking
- ✅ Performance monitoring (10% sample rate in production)
- ✅ HTTP request tracking
- ✅ Express integration
- ✅ Sensitive data filtering (passwords, tokens, cookies)

### Frontend
- ✅ Automatic error tracking
- ✅ React component error boundaries
- ✅ Performance monitoring (10% sample rate in production)
- ✅ Session replay (10% of sessions, 100% of error sessions)
- ✅ Sensitive data masking

## Usage Examples

### Manual Error Capture (Backend)

```typescript
import { captureException, captureMessage } from './server/sentry';

try {
  // Your code
} catch (error) {
  captureException(error, {
    userId: user.id,
    action: 'create_vehicle',
  });
}

// Log important events
captureMessage('Vehicle created successfully', 'info');
```

### Manual Error Capture (Frontend)

```typescript
import { captureException, setUser } from '@/lib/sentry';

// Set user context after login
setUser({
  id: user.id,
  email: user.email,
  role: user.role,
});

// Capture errors
try {
  // Your code
} catch (error) {
  captureException(error, {
    component: 'FleetPage',
    action: 'addVehicle',
  });
}
```

### Error Boundary (Frontend)

```typescript
import { ErrorBoundary } from '@/lib/sentry';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Cost Considerations

**Free Tier:**
- 10,000 errors/month
- 10,000 performance transactions/month
- 50 session replays/month
- 1 team member

**Paid Plans:**
- Start at $26/month for 50K errors
- Volume discounts available
- Can disable features to save costs

## Privacy & Security

The configuration automatically:
- ✅ Removes passwords, tokens, and cookies from error reports
- ✅ Masks all text in session replays
- ✅ Blocks all media in session replays
- ✅ Filters sensitive headers
- ✅ Complies with GDPR requirements

## Monitoring Best Practices

1. **Set up alerts** for critical errors
2. **Review errors weekly** to identify patterns
3. **Track performance** trends over time
4. **Use session replays** to understand user issues
5. **Assign errors** to team members for resolution

## Disabling Sentry

To disable Sentry (e.g., in development):

```bash
# Remove or comment out the DSN variables
# SENTRY_DSN=
# VITE_SENTRY_DSN=
```

The app will continue to work normally without Sentry.

## Support

- Sentry Documentation: https://docs.sentry.io
- Sentry Support: https://sentry.io/support
- Community Forum: https://forum.sentry.io

## Next Steps

1. ✅ Sentry code is integrated
2. ⏳ Create Sentry projects
3. ⏳ Add DSN to environment variables
4. ⏳ Deploy to production
5. ⏳ Monitor errors and performance
