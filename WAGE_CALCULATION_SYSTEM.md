# Flexible Wage Calculation System

## Overview

The Titan Fleet wage calculation system provides **comprehensive, flexible pay rate management** with automatic wage calculations based on:
- Time of day (night shift premiums)
- Day of week (weekend rates)
- Bank holidays (premium rates)
- Overtime thresholds
- Per-driver custom rates

**Key Benefit:** Export timesheets as CSV with **complete wage breakdowns** ready for direct import into payroll systems.

---

## Features

### 1. **Flexible Pay Rates** 💰
- **Base Rate:** Standard hourly pay
- **Night Rate:** Premium for night shifts (configurable hours, default 10 PM - 6 AM)
- **Weekend Rate:** Higher pay for Saturday/Sunday
- **Bank Holiday Rate:** Premium for public holidays
- **Overtime Multiplier:** Extra pay after threshold hours (default 1.5x)

### 2. **Smart Hour Calculation** 🧠
- Automatically detects time of day, day of week, and bank holidays
- Splits shifts across multiple rate types
- Calculates exact minutes for each rate category
- Handles overnight shifts correctly

### 3. **Enhanced CSV Export** 📊
- Complete wage breakdown by hour type
- All rates clearly listed
- Total wages calculated automatically
- Ready for payroll system import

### 4. **Management UI** 🎨
- Easy-to-use interface for configuring rates
- Real-time CSV preview
- Bank holiday management
- Per-driver custom rates (optional)

---

## Database Schema

### Pay Rates Table
```typescript
payRates {
  id: number;
  companyId: number;
  driverId: number | null; // null = company default
  
  // Rates (£/hour)
  baseRate: string; // e.g., "12.00"
  nightRate: string; // e.g., "15.00"
  weekendRate: string; // e.g., "18.00"
  bankHolidayRate: string; // e.g., "24.00"
  overtimeMultiplier: string; // e.g., "1.5"
  
  // Thresholds
  nightStartHour: number; // e.g., 22 (10 PM)
  nightEndHour: number; // e.g., 6 (6 AM)
  dailyOvertimeThreshold: number; // minutes, e.g., 480 (8 hours)
  weeklyOvertimeThreshold: number; // minutes, e.g., 2400 (40 hours)
  
  // Status
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}
```

### Bank Holidays Table
```typescript
bankHolidays {
  id: number;
  companyId: number;
  name: string; // e.g., "Christmas Day"
  date: Date;
  isRecurring: boolean;
}
```

### Wage Calculations Table
```typescript
wageCalculations {
  id: number;
  timesheetId: number;
  companyId: number;
  driverId: number;
  payRateId: number;
  
  // Hours breakdown (minutes)
  regularMinutes: number;
  nightMinutes: number;
  weekendMinutes: number;
  bankHolidayMinutes: number;
  overtimeMinutes: number;
  
  // Wage breakdown (£)
  regularPay: string;
  nightPay: string;
  weekendPay: string;
  bankHolidayPay: string;
  overtimePay: string;
  totalPay: string;
  
  calculatedAt: Date;
}
```

---

## How It Works

### Calculation Flow

1. **Driver clocks out** from shift
2. **System retrieves pay rate** for driver (or company default)
3. **Checks if bank holiday** for that date
4. **Splits shift into time segments:**
   - Regular hours (weekday, daytime)
   - Night hours (10 PM - 6 AM)
   - Weekend hours (Saturday/Sunday)
   - Bank holiday hours (if applicable)
5. **Calculates overtime** (hours beyond daily threshold)
6. **Multiplies each segment** by corresponding rate
7. **Saves calculation** to database
8. **Includes in CSV export**

### Example Calculation

**Scenario:**
- Driver: John Smith
- Shift: Monday, 08:00 - 17:30 (9.5 hours)
- Rates: Base £12/hr, Overtime 1.5x
- Overtime threshold: 8 hours

**Breakdown:**
- Regular hours: 8.0 hours × £12 = £96.00
- Overtime hours: 1.5 hours × £18 (£12 × 1.5) = £27.00
- **Total pay: £123.00**

**CSV Output:**
```
"John Smith",01/02/2026,08:00,17:30,"Main Depot",9.50,8.00,0.00,0.00,0.00,1.50,12.00,15.00,18.00,24.00,18.00,96.00,0.00,0.00,0.00,27.00,123.00,COMPLETED
```

---

## CSV Export Format

### Column Structure

| Column | Description | Example |
|--------|-------------|---------|
| Driver Name | Full name | "John Smith" |
| Date | Shift date | 01/02/2026 |
| Clock In | Start time | 08:00 |
| Clock Out | End time | 17:30 |
| Depot | Location | "Main Depot" |
| Total Hours | Total shift hours | 9.50 |
| Regular Hours | Base rate hours | 8.00 |
| Night Hours | Night shift hours | 0.00 |
| Weekend Hours | Weekend hours | 0.00 |
| Bank Holiday Hours | Holiday hours | 0.00 |
| Overtime Hours | Overtime hours | 1.50 |
| Base Rate | £/hour | 12.00 |
| Night Rate | £/hour | 15.00 |
| Weekend Rate | £/hour | 18.00 |
| Holiday Rate | £/hour | 24.00 |
| Overtime Rate | £/hour | 18.00 |
| Regular Pay | £ | 96.00 |
| Night Pay | £ | 0.00 |
| Weekend Pay | £ | 0.00 |
| Holiday Pay | £ | 0.00 |
| Overtime Pay | £ | 27.00 |
| **Total Pay** | **£** | **123.00** |
| Status | Shift status | COMPLETED |

### Import into Payroll

The CSV format is designed to be **directly importable** into most payroll systems:
- All calculations are complete
- Rates are clearly listed
- Hours are broken down by type
- Total wages are calculated
- Ready for verification and processing

---

## Management UI

### Location
`/manager/pay-rates`

### Features

#### 1. Pay Rates Tab
- Configure all hourly rates
- Set night shift hours
- Define overtime thresholds
- Real-time rate preview

#### 2. Bank Holidays Tab
- View all configured holidays
- One-click UK holiday import
- Add custom holidays
- Recurring holiday support

#### 3. CSV Preview Tab
- See example CSV output
- Preview wage calculations
- Understand how rates apply
- Verify configuration

---

## API Endpoints

### Get Pay Rates
```http
GET /api/pay-rates/:companyId
```

**Response:**
```json
[
  {
    "id": 1,
    "companyId": 1,
    "driverId": null,
    "baseRate": "12.00",
    "nightRate": "15.00",
    "weekendRate": "18.00",
    "bankHolidayRate": "24.00",
    "overtimeMultiplier": "1.5",
    "nightStartHour": 22,
    "nightEndHour": 6,
    "dailyOvertimeThreshold": 480,
    "isActive": true
  }
]
```

### Update Pay Rate
```http
PATCH /api/pay-rates/:id
Content-Type: application/json

{
  "baseRate": "13.00",
  "nightRate": "16.00"
}
```

### Get Bank Holidays
```http
GET /api/bank-holidays/:companyId
```

### Initialize UK Bank Holidays
```http
POST /api/bank-holidays/init-uk/:companyId/:year
```

Automatically adds all UK public holidays for the specified year.

### Calculate Wages for Timesheet
```http
POST /api/wages/calculate/:timesheetId
Content-Type: application/json

{
  "companyId": 1,
  "driverId": 10,
  "arrivalTime": "2026-02-01T08:00:00Z",
  "departureTime": "2026-02-01T17:30:00Z"
}
```

**Response:**
```json
{
  "regularMinutes": 480,
  "nightMinutes": 0,
  "weekendMinutes": 0,
  "bankHolidayMinutes": 0,
  "overtimeMinutes": 90,
  "regularPay": 96.00,
  "nightPay": 0.00,
  "weekendPay": 0.00,
  "bankHolidayPay": 0.00,
  "overtimePay": 27.00,
  "totalPay": 123.00
}
```

---

## Usage Examples

### Example 1: Regular Weekday Shift
**Shift:** Monday, 08:00 - 17:00 (9 hours)
**Rates:** Base £12/hr, Overtime 1.5x
**Threshold:** 8 hours

**Calculation:**
- Regular: 8 hours × £12 = £96.00
- Overtime: 1 hour × £18 = £18.00
- **Total: £114.00**

### Example 2: Night Shift
**Shift:** Monday, 22:00 - 06:00 (8 hours)
**Rates:** Base £12/hr, Night £15/hr

**Calculation:**
- Night: 8 hours × £15 = £120.00
- **Total: £120.00**

### Example 3: Weekend Shift
**Shift:** Saturday, 08:00 - 16:00 (8 hours)
**Rates:** Base £12/hr, Weekend £18/hr

**Calculation:**
- Weekend: 8 hours × £18 = £144.00
- **Total: £144.00**

### Example 4: Bank Holiday
**Shift:** Christmas Day, 08:00 - 16:00 (8 hours)
**Rates:** Base £12/hr, Bank Holiday £24/hr

**Calculation:**
- Bank Holiday: 8 hours × £24 = £192.00
- **Total: £192.00**

### Example 5: Mixed Shift (Overnight)
**Shift:** Friday, 20:00 - Saturday 04:00 (8 hours)
**Rates:** Base £12/hr, Night £15/hr, Weekend £18/hr
**Night hours:** 22:00 - 06:00

**Calculation:**
- Regular: 2 hours (20:00-22:00) × £12 = £24.00
- Night: 6 hours (22:00-04:00) × £15 = £90.00
- **Total: £114.00**

---

## Setup Instructions

### 1. Database Migration
The system will automatically create the required tables on first deployment:
- `pay_rates`
- `bank_holidays`
- `wage_calculations`

### 2. Initialize Default Rates
When a company first accesses `/manager/pay-rates`, default rates are automatically created:
- Base Rate: £12.00/hour
- Night Rate: £15.00/hour (25% premium)
- Weekend Rate: £18.00/hour (50% premium)
- Bank Holiday Rate: £24.00/hour (100% premium)
- Overtime Multiplier: 1.5x
- Night Hours: 22:00 - 06:00
- Daily Overtime Threshold: 8 hours

### 3. Configure Bank Holidays
1. Go to `/manager/pay-rates`
2. Click "Bank Holidays" tab
3. Click "Add UK Holidays (2026)"
4. UK public holidays are automatically added

### 4. Customize Rates
1. Go to `/manager/pay-rates`
2. Adjust rates as needed
3. Click "Save Changes"
4. Rates apply immediately to new timesheets

### 5. Export Timesheets
1. Go to `/manager/timesheets`
2. Select date range
3. Click "Export CSV"
4. CSV includes complete wage breakdown
5. Import into payroll system

---

## Benefits

### For Managers
- ✅ Accurate wage calculations
- ✅ Transparent pay breakdown
- ✅ Easy payroll processing
- ✅ Audit trail for all calculations
- ✅ Flexible rate configuration

### For Drivers
- ✅ Fair pay for night shifts
- ✅ Weekend premium pay
- ✅ Bank holiday bonuses
- ✅ Overtime compensation
- ✅ Transparent wage calculation

### For Payroll
- ✅ Ready-to-import CSV
- ✅ All calculations complete
- ✅ Clear rate breakdown
- ✅ No manual calculations needed
- ✅ Reduced processing time

---

## Technical Details

### Wage Calculation Service
Location: `server/wageCalculationService.ts`

**Key Functions:**
- `calculateWages()` - Main calculation function
- `calculateHoursBreakdown()` - Splits hours by type
- `calculateNightMinutes()` - Detects night hours
- `getPayRate()` - Retrieves applicable rate
- `checkBankHoliday()` - Checks if date is holiday
- `initializeDefaultPayRates()` - Creates default rates
- `addUKBankHolidays()` - Adds UK public holidays

### CSV Export Enhancement
Location: `server/storage.ts`

The `generateTimesheetCSV()` function has been enhanced to:
- Include wage calculations for each timesheet
- Add detailed hour breakdown columns
- Add rate columns
- Add pay breakdown columns
- Calculate total pay

### Management UI
Location: `client/src/pages/manager/PayRates.tsx`

**Features:**
- Three-tab interface (Rates, Holidays, Preview)
- Real-time rate editing
- CSV preview with example calculations
- Bank holiday management
- One-click UK holiday import

---

## Future Enhancements

### Planned Features
1. **Per-driver custom rates** - Different rates for different drivers
2. **Rate history** - Track rate changes over time
3. **Wage reports** - Analytics on wage costs
4. **Budget forecasting** - Predict wage costs
5. **Multiple rate tiers** - Junior/senior driver rates
6. **Shift differentials** - Extra pay for specific shifts
7. **Weekly overtime** - Overtime after 40 hours/week
8. **Automatic rate increases** - Scheduled rate changes

---

## Troubleshooting

### Issue: Wages not calculating
**Solution:** Ensure pay rates are configured at `/manager/pay-rates`

### Issue: Bank holidays not recognized
**Solution:** Add holidays via "Bank Holidays" tab

### Issue: CSV missing wage columns
**Solution:** Ensure timesheets have completed status

### Issue: Incorrect night hours
**Solution:** Verify night start/end hours in pay rates settings

---

## Summary

The Titan Fleet wage calculation system provides **comprehensive, flexible, and accurate** wage calculations with:
- ✅ Multiple pay rates (base, night, weekend, holiday, overtime)
- ✅ Automatic hour breakdown by rate type
- ✅ Enhanced CSV export ready for payroll
- ✅ Easy-to-use management interface
- ✅ Complete audit trail

**Result:** Managers can export timesheets as CSV and import directly into payroll systems with **zero manual calculations required**.

---

## Support

For questions or issues with the wage calculation system, contact your system administrator or refer to the main Titan Fleet documentation.
