# Notification Scheduler Documentation

## Overview

The Titan Fleet notification scheduler automatically sends compliance alerts to fleet managers for:
- **MOT Expiry** - Alerts when vehicle MOT is due soon
- **Tax Expiry** - Alerts when vehicle road tax is due soon
- **Service Due** - Alerts when vehicle service is due soon

The scheduler runs automatically every day at 8:00 AM and can also be triggered manually via API.

**Notification Channels:**
- ✅ **In-App Notifications** - Appear in dashboard notification center with bell icon
- ✅ **Email Notifications** - Sent to manager's email address
- ⏳ **SMS Notifications** - Not implemented (in-app preferred)

---

## How It Works

### Automatic Scheduling

The scheduler uses `node-cron` to run daily checks:

```typescript
// Runs every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  await runNotificationChecks();
});
```

### Notification Logic

For each notification type, the scheduler:

1. **Fetches all companies** from the database
2. **Checks notification preferences** for each company
3. **Finds all managers** for each company
4. **Finds vehicles** with upcoming expiry dates
5. **Calculates days until expiry**
6. **Sends in-app notifications** to all managers via pushNotificationService
7. **Sends email notifications** to manager email addresses

### Example: Service Due Notifications

```typescript
// Check if service is due within threshold (default: 14 days)
const thresholdDate = new Date();
thresholdDate.setDate(thresholdDate.getDate() + 14);

// Find vehicles with service due before threshold
const vehicles = await db.select()
  .from(vehicles)
  .where(lte(vehicles.nextServiceDue, thresholdDate));

// Get all managers for this company
const managers = await db.select()
  .from(users)
  .where(and(
    eq(users.companyId, company.id),
    eq(users.role, 'manager')
  ));

// Send notification to each manager
for (const vehicle of vehicles) {
  for (const manager of managers) {
    await sendNotification({
      companyId: company.id,
      userId: manager.id, // ← Enables in-app notification
      vehicleId: vehicle.id,
      type: 'SERVICE_DUE',
      recipient: manager.email,
      subject: `Service Due Alert - ${vehicle.vrm}`,
      message: `Vehicle ${vehicle.vrm} service is due in ${daysUntilDue} days`
    });
  }
}
```

---

## Configuration

### Notification Preferences

Managers can configure notification settings at `/manager/notification-preferences`:

- **Enable/Disable** each notification type
- **Set days before expiry** to send alerts (e.g., 30 days for MOT, 14 days for Service)
- **Set custom email address** for notifications

### Default Settings

| Notification Type | Enabled | Days Before Expiry |
|-------------------|---------|-------------------|
| MOT Expiry | ✅ Yes | 30 days |
| Tax Expiry | ✅ Yes | 30 days |
| Service Due | ✅ Yes | 14 days |
| VOR Status | ✅ Yes | Immediate |
| Defect Reported | ✅ Yes | Immediate |
| Inspection Failed | ✅ Yes | Immediate |

---

## In-App Notifications

### How In-App Notifications Work

When the scheduler runs, it automatically creates in-app notifications for all managers in addition to sending emails.

**Flow:**
1. Scheduler identifies vehicles with upcoming expiry dates
2. Finds all managers for the company (`role = 'manager'`)
3. Calls `sendNotification()` with `userId` parameter
4. `sendNotification()` automatically calls `pushNotificationService.sendToUser()`
5. Notification is saved to `notifications` table
6. Notification appears in manager's dashboard notification center

### Notification Center UI

**Location:** Top-right corner of manager dashboard (bell icon)

**Features:**
- 🔔 Bell icon with unread count badge
- Click to open notification dropdown
- Shows recent notifications (title + message)
- Click notification to view details
- Mark as read functionality
- Link to full notification history page

**Notification Types:**
- 🚗 MOT Expiry Alert (normal priority)
- 💷 Tax Expiry Alert (normal priority)
- 🔧 Service Due Alert (normal priority)
- ⚠️ VOR Status Change (high priority)
- 🔴 Defect Reported (high priority)
- ❌ Inspection Failed (high priority)

### Priority Levels

**High Priority** (red badge, top of list):
- VOR Status Changes
- Defect Reports
- Failed Inspections

**Normal Priority** (blue badge):
- MOT Expiry
- Tax Expiry
- Service Due

### Database Schema

```typescript
interface Notification {
  id: number;
  companyId: number;
  senderId: number; // 0 for system notifications
  recipientId: number; // Manager user ID
  isBroadcast: boolean;
  title: string;
  message: string;
  priority: 'HIGH' | 'NORMAL';
  isRead: boolean;
  createdAt: Date;
}
```

### Viewing Notifications

**API Endpoint:**
```http
GET /api/notifications?userId={userId}&limit=50&offset=0
```

**Response:**
```json
{
  "notifications": [
    {
      "id": 123,
      "title": "MOT Expiry Alert - ABC123",
      "message": "Vehicle ABC123 (Ford Transit) MOT expires in 25 days on 01/03/2026.",
      "priority": "NORMAL",
      "isRead": false,
      "createdAt": "2026-02-02T08:00:00.000Z"
    }
  ],
  "total": 15,
  "unreadCount": 5
}
```

---

## API Endpoints

### Get Scheduler Status

```http
GET /api/scheduler/status
```

**Response:**
```json
{
  "isRunning": true,
  "lastRunTime": "2026-02-02T08:00:00.000Z",
  "lastRunStatus": "success",
  "lastRunError": null,
  "nextRunTime": "Daily at 8:00 AM"
}
```

### Manual Trigger (POST)

```http
POST /api/scheduler/run
```

**Response:**
```json
{
  "message": "Notification checks completed",
  "success": true,
  "timestamp": "2026-02-02T14:30:00.000Z",
  "results": {
    "motExpiry": { "success": true },
    "taxExpiry": { "success": true },
    "serviceDue": { "success": true }
  }
}
```

### Cron Endpoint (GET)

For external cron services like GitHub Actions:

```http
GET /api/cron/run-notifications
```

**Response:** Same as POST /api/scheduler/run

**Security Note:** Add authentication by uncommenting the auth check in `server/routes.ts`:

```typescript
const authHeader = req.headers.authorization;
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return res.status(401).json({ error: "Unauthorized" });
}
```

---

## Testing

### Manual Test via API

Use curl or Postman to trigger notifications manually:

```bash
# Check scheduler status
curl http://localhost:5000/api/scheduler/status

# Run notifications manually
curl -X POST http://localhost:5000/api/scheduler/run
```

### Test with Real Data

1. **Create a test vehicle** with upcoming service date:
   ```sql
   UPDATE vehicles 
   SET nextServiceDue = CURRENT_DATE + INTERVAL '10 days'
   WHERE id = 1;
   ```

2. **Enable service notifications** in preferences:
   - Go to `/manager/notification-preferences`
   - Enable "Service Due" notifications
   - Set days before expiry to 14
   - Set email address

3. **Trigger scheduler manually**:
   ```bash
   curl -X POST http://localhost:5000/api/scheduler/run
   ```

4. **Check email** for notification

---

## Troubleshooting

### Notifications Not Sending

**Check 1: Scheduler Running?**
```bash
curl http://localhost:5000/api/scheduler/status
```

Expected: `"isRunning": true`

**Check 2: Notification Preferences**
- Go to `/manager/notification-preferences`
- Verify notifications are enabled
- Verify email address is set

**Check 3: Email Service**
- Check Resend API key is configured
- Check server logs for email errors

**Check 4: Vehicle Data**
- Verify vehicles have expiry dates set
- Verify dates are within threshold

### Scheduler Not Starting

**Check server logs on startup:**
```
[scheduler] Starting notification scheduler...
[scheduler] ✓ Notification scheduler started (runs daily at 8:00 AM)
[scheduler] Running initial notification check on startup...
```

If missing, check:
- `server/index.ts` imports `startScheduler`
- `startScheduler()` is called in server listen callback

### Manual Trigger Fails

**Check error response:**
```bash
curl -X POST http://localhost:5000/api/scheduler/run
```

Common errors:
- `"getAllCompanies" does not exist` - Database storage method missing
- Email errors - Resend API key not configured
- Database errors - Connection issues

---

## Architecture

### File Structure

```
server/
├── scheduler.ts              # Cron scheduler service
├── notificationService.ts    # Notification logic
├── routes.ts                 # API endpoints
└── index.ts                  # Server startup (calls startScheduler)
```

### Flow Diagram

```
Server Startup
    ↓
startScheduler()
    ↓
Cron Job (Daily 8:00 AM)
    ↓
runNotificationChecks()
    ↓
├─ checkMOTExpiry()
├─ checkTaxExpiry()
└─ checkServiceDue()
    ↓
For each check:
    ├─ Get all companies
    ├─ Check preferences
    ├─ Find vehicles
    └─ Send notifications
```

---

## Future Enhancements

### Planned Features

1. **License Expiry Notifications**
   - Alert when driver's license is expiring
   - Currently commented out in scheduler

2. **Multiple Reminder Levels**
   - First reminder: 30 days before
   - Second reminder: 14 days before
   - Final reminder: 3 days before
   - Overdue alert: Day after expiry

3. **SMS Notifications**
   - Send SMS via Twilio for urgent alerts
   - Configurable per notification type

4. **Webhook Support**
   - POST notifications to external systems
   - Integration with fleet management software

5. **Notification History**
   - Track all sent notifications
   - View in dashboard
   - Export to CSV

### Adding New Notification Types

To add a new notification type:

1. **Add function to `notificationService.ts`:**
   ```typescript
   export async function checkInsuranceExpiry(): Promise<void> {
     // Implementation
   }
   ```

2. **Add to scheduler in `scheduler.ts`:**
   ```typescript
   import { checkInsuranceExpiry } from './notificationService';
   
   // In runNotificationChecks():
   try {
     await checkInsuranceExpiry();
     results.insuranceExpiry.success = true;
   } catch (error) {
     results.insuranceExpiry.success = false;
   }
   ```

3. **Update notification preferences UI**
4. **Update database schema** if needed

---

## Production Deployment

### Environment Variables

No additional environment variables required. Uses existing:
- `DATABASE_URL` - Database connection
- Resend API key (for email sending)

### Monitoring

Monitor scheduler health:
- Check `/api/scheduler/status` endpoint
- Set up uptime monitoring (e.g., UptimeRobot)
- Configure alerts for failed checks

### Scaling

For high-volume fleets:
- Run scheduler on separate worker process
- Use message queue (Redis, RabbitMQ)
- Batch notifications to avoid rate limits

---

## Support

For issues or questions:
- Check server logs for errors
- Test manually via API endpoints
- Verify notification preferences
- Contact support with error logs

---

**Last Updated:** February 2, 2026  
**Version:** 1.0.0
