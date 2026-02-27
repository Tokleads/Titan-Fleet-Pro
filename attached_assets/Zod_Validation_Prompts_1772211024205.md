# Zod Validation Prompts

It looks like the `routes.ts` split did not get committed to your GitHub, so the file is still 6,000 lines long. That is fine — we can add the validation directly to the main file.

Here are the sequenced prompts for Replit AI to add Zod input validation to the **90 routes** that are currently missing it. The work is broken down into 6 logical parts. Run them one at a time and test the app after each one.

**The Strategy:**

Each prompt will target a group of related routes within `server/routes.ts`. For each route, it will use the existing Drizzle-Zod schemas from `shared/schema.ts` where possible, or create a new local schema if one does not exist. It will use `.safeParse()` to validate the request body and return a 400 error on failure.

---

## Prompt 1: Defects & Maintenance Routes

**Goal:** Add Zod validation to all routes that create or update defects and maintenance records.

```
I need to add Zod input validation to our backend. This is Part 1, focusing on the defect and maintenance routes in `server/routes.ts`.

For each of the `POST`, `PUT`, or `PATCH` routes listed below, you must:

1.  Find the route handler in `server/routes.ts`.
2.  Add a Zod validation step at the beginning of the `try` block using `.safeParse()`.
3.  If validation fails, return a 400 error with the Zod issues.
4.  Use the existing Drizzle-Zod schemas from `@shared/schema` where they match. If a schema for an update (PATCH) does not exist, create one by using `.partial()` on the insert schema.

**Example:**

```typescript
// BEFORE
app.post("/api/defects", async (req, res) => {
  try {
    const defect = await storage.createDefect(req.body);
    res.status(201).json(defect);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// AFTER
app.post("/api/defects", async (req, res) => {
  try {
    const validation = insertDefectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
    }
    const defect = await storage.createDefect(validation.data);
    res.status(201).json(defect);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
```

**Apply this pattern to the following routes:**

1.  `POST /api/defects` (Line 870) - Use `insertDefectSchema`.
2.  `PATCH /api/manager/defects/:id` (Line 1558) - Use `insertDefectSchema.partial()`.
3.  `POST /api/manager/vehicles/:id/vor` (Line 1748) - Create a new schema: `z.object({ reason: z.string().min(1) })`.
4.  `POST /api/manager/vehicles/:id/vor/resolve` (Line 1784) - No body to validate, skip.
5.  `POST /api/manager/vehicles/:id/service` (Line 1863) - Use `insertServiceHistorySchema`.
6.  `PATCH /api/maintenance-alerts/:id/acknowledge` (Line 939) - No body to validate, skip.

```

---

## Prompt 2: Timesheets & Pay Routes

**Goal:** Add Zod validation to the timesheet, pay rate, and wage calculation routes.

```
This is Part 2 of adding Zod validation, focusing on the timesheet and pay routes in `server/routes.ts`.

Apply the same validation pattern as before to these routes:

1.  `POST /api/timesheets/export` (Line 3766) - Create schema: `z.object({ companyId: z.number(), driverId: z.number().optional(), startDate: z.string().datetime(), endDate: z.string().datetime() })`.
2.  `PATCH /api/timesheets/:id` (Line 3796) - Use `insertTimesheetSchema.partial()`.
3.  `POST /api/timesheets/:id/approve-adjustment` (Line 3857) - No body, skip.
4.  `POST /api/timesheets/:id/reject-adjustment` (Line 3902) - No body, skip.
5.  `POST /api/timesheets/clock-in` (Line 3946) - Use `insertTimesheetSchema.pick({ userId: true, companyId: true, vehicleId: true, trailerId: z.number().optional().nullable() })`.
6.  `POST /api/timesheets/clock-out` (Line 3987) - Create schema: `z.object({ timesheetId: z.number() })`.
7.  `POST /api/manager/clock-in-driver` (Line 4010) - Use `insertTimesheetSchema.pick({ userId: true, companyId: true, vehicleId: true, trailerId: z.number().optional().nullable() })`.
8.  `POST /api/manager/clock-out-driver` (Line 4073) - Create schema: `z.object({ timesheetId: z.number() })`.
9.  `POST /api/pay-rates` (Line 4156) - Use `insertPayRateSchema`.
10. `PATCH /api/pay-rates/:id` (Line 4170) - Use `insertPayRateSchema.partial()`.
11. `POST /api/bank-holidays` (Line 4207) - Use `insertBankHolidaySchema`.
12. `POST /api/pay-rates/driver` (Line 4294) - Create schema: `z.object({ driverId: z.number(), payRateId: z.number() })`.
13. `POST /api/wages/export-csv` (Line 4399) - Create schema: `z.object({ companyId: z.number(), startDate: z.string().datetime(), endDate: z.string().datetime() })`.

```

---

## Prompt 3: GPS, Geofencing & Delivery Routes

**Goal:** Add Zod validation to the location tracking and delivery/POD routes.

```
This is Part 3 of adding Zod validation, focusing on GPS, geofencing, and delivery routes in `server/routes.ts`.

Apply the validation pattern to these routes:

1.  `POST /api/driver/location` (Line 3529) - Use `insertDriverLocationSchema`.
2.  `POST /api/driver/location/batch` (Line 3571) - Use `z.array(insertDriverLocationSchema)`.
3.  `POST /api/geofences` (Line 3629) - Use `insertGeofenceSchema`.
4.  `PATCH /api/geofences/:id` (Line 3669) - Use `insertGeofenceSchema.partial()`.
5.  `POST /api/deliveries/upload-url` (Line 5544) - Create schema: `z.object({ fileName: z.string(), contentType: z.string() })`.
6.  `PATCH /api/manager/deliveries/:id/status` (Line 5655) - Create schema: `z.object({ status: z.enum([ ... ]) })` with the valid statuses from the `deliveries` table schema.
7.  `POST /api/manager/deliveries/bulk-status` (Line 5673) - Create schema: `z.object({ deliveryIds: z.array(z.number()), status: z.enum([ ... ]) })`.

```

---

## Prompt 4: Compliance & Document Routes

**Goal:** Add Zod validation to compliance, documents, and operator licence routes.

```
This is Part 4 of adding Zod validation, focusing on compliance and document-related routes in `server/routes.ts`.

Apply the validation pattern to these routes:

1.  `POST /api/reminders` (Line 3243) - Use `insertReminderSchema`.
2.  `PATCH /api/reminders/:id/complete` (Line 3254) - No body, skip.
3.  `PATCH /api/reminders/:id/snooze` (Line 3274) - Create schema: `z.object({ days: z.number().int().positive() })`.
4.  `PATCH /api/reminders/:id/dismiss` (Line 3294) - No body, skip.
5.  `POST /api/manager/drivers/:driverId/verify-license` (Line 4859) - No body, skip.
6.  `POST /api/operator-licences` (Line 5778) - Use `insertOperatorLicenceSchema`.
7.  `PUT /api/operator-licences/:id` (Line 5796) - Use `insertOperatorLicenceSchema.partial()`.
8.  `POST /api/operator-licences/:id/vehicles` (Line 5859) - Create schema: `z.object({ vehicleIds: z.array(z.number()) })`.
9.  `POST /api/car-register` (Line 5886) - Use `insertCompanyCarRegisterSchema`.
10. `PATCH /api/car-register/:id/end` (Line 5907) - No body, skip.
11. `PATCH /api/manager/documents/:id` (Line 2739) - Use `insertDocumentSchema.partial()`.
12. `POST /api/documents/:id/acknowledge` (Line 2810) - No body, skip.

```

---

## Prompt 5: Settings & Notification Routes

**Goal:** Add Zod validation to company settings, 2FA, and notification routes.

```
This is Part 5 of adding Zod validation, focusing on settings and notification routes in `server/routes.ts`.

Apply the validation pattern to these routes:

1.  `POST /api/manager/2fa/setup/:userId` (Line 2528) - No body, skip.
2.  `POST /api/manager/2fa/enable/:userId` (Line 2561) - Create schema: `z.object({ token: z.string().length(6) })`.
3.  `POST /api/manager/2fa/disable/:userId` (Line 2605) - No body, skip.
4.  `PATCH /api/manager/company/:companyId/settings` (Line 2833) - Use `insertCompanySchema.pick({ settings: true }).partial()`.
5.  `PATCH /api/manager/company/:companyId/gdrive` (Line 2934) - Create schema: `z.object({ gdriveFolderId: z.string().nullable() })`.
6.  `POST /api/manager/company/:companyId/gdrive/test` (Line 2979) - No body, skip.
7.  `POST /api/manager/company/:companyId/logo/upload` (Line 3003) - No body (uses express-fileupload), skip.
8.  `PATCH /api/manager/company/:companyId/logo` (Line 3020) - Create schema: `z.object({ logoUrl: z.string().url() })`.
9.  `POST /api/notifications/broadcast` (Line 4576) - Create schema: `z.object({ title: z.string(), body: z.string(), companyId: z.number() })`.
10. `POST /api/notifications/individual` (Line 4601) - Create schema: `z.object({ title: z.string(), body: z.string(), userId: z.number() })`.
11. `PATCH /api/notifications/mark-all-read` (Line 4691) - No body, skip.
12. `PATCH /api/notifications/:id/read` (Line 4725) - No body, skip.

```

---

## Prompt 6: Remaining & Public Routes

**Goal:** Add Zod validation to the remaining miscellaneous and public-facing routes.

```
This is the final part of adding Zod validation, focusing on the remaining routes in `server/routes.ts`.

Apply the validation pattern to these routes:

1.  `POST /api/stripe/checkout` (Line 171) - Create schema: `z.object({ priceId: z.string(), companyId: z.number().optional(), referralCode: z.string().optional() })`.
2.  `POST /api/stripe/portal` (Line 228) - Create schema: `z.object({ customerId: z.string(), returnUrl: z.string().url() })`.
3.  `POST /api/feedback` (Line 260) - Create schema: `z.object({ type: z.string(), message: z.string(), userId: z.number().optional() })`.
4.  `POST /api/defect-photos/request-url` (Line 380) - Create schema: `z.object({ defectId: z.number(), fileName: z.string(), contentType: z.string() })`.
5.  `PATCH /api/manager/messages/:id/read` (Line 2914) - No body, skip.
6.  `POST /api/shift-checks` (Line 3089) - Use `insertShiftCheckSchema`.
7.  `POST /api/shift-checks/:id/item` (Line 3112) - Use `insertShiftCheckItemSchema`.
8.  `POST /api/shift-checks/:id/complete` (Line 3153) - No body, skip.
9.  `PUT /api/user-roles/:userId/permissions` (Line 5203) - Create schema: `z.object({ permissions: z.array(z.string()) })`.
10. `POST /api/referral/validate/:code` (Line 5354) - No body, skip.
11. `POST /api/referral/apply` (Line 5382) - Create schema: `z.object({ referralCode: z.string(), companyId: z.number() })`.

```
