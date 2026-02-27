# Splitting routes.ts Prompts

Here are the sequenced prompts for Replit AI to safely refactor your 6,000-line `server/routes.ts` into separate, maintainable files. Run them one at a time and verify the app still works after each one.

**The Strategy:**

Each prompt will move a group of related routes into a new file (e.g., `complianceRoutes.ts`). It will follow the existing `register...Routes(app)` pattern you already use for `vehicleManagementRoutes.ts`.

---

## Prompt 1: Compliance Routes

**Goal:** Move all vehicle and driver compliance-related routes into a new `server/complianceRoutes.ts` file.

```
Our `server/routes.ts` file is too large. I need to start splitting it into smaller, more focused files. This is the first step.

Your task is to create a new file, `server/complianceRoutes.ts`, and move all compliance-related routes into it.

**Step 1: Create the New File**

Create `server/complianceRoutes.ts`. It will have this structure:

```typescript
import type { Express } from "express";
// ... other necessary imports will go here

export function registerComplianceRoutes(app: Express) {
  // All the route handlers will be moved here
}
```

**Step 2: Move the Route Sections**

Find these four sections in `server/routes.ts`, cut them out, and paste them inside the `registerComplianceRoutes` function you just created:

1.  `// ===== REMINDER ROUTES (Compliance Tracking) =====` (starts around line 3216)
2.  `// ==================== DVLA LICENSE VERIFICATION ====================` (starts around line 4840)
3.  `// ==================== OPERATOR LICENCES ====================` (starts around line 5697)
4.  `// ==================== COMPANY CAR REGISTER ====================` (starts around line 5884)

**Step 3: Add Necessary Imports**

After moving the code, the new file will have missing imports. Copy the necessary imports from the top of `routes.ts` into the top of `complianceRoutes.ts`. You will likely need `db`, `storage`, various schema objects from `@shared/schema`, and functions from `drizzle-orm`.

**Step 4: Register the New Routes**

Finally, in `server/routes.ts`:

1.  Import the new function at the top: `import { registerComplianceRoutes } from "./complianceRoutes";`
2.  Call the function inside the main `registerRoutes` function, near the other `register...` calls: `registerComplianceRoutes(app);`

After this is done, the main `routes.ts` file should be about 700 lines shorter, and the app should function exactly as before.
```

---

## Prompt 2: Operations & Tracking Routes

**Goal:** Move all live operations and tracking routes into a new `server/operationsRoutes.ts` file.

```
This is the second step in splitting our `routes.ts` file.

Your task is to create a new file, `server/operationsRoutes.ts`, and move all routes related to live tracking and vehicle operations into it.

**Step 1: Create the New File**

Create `server/operationsRoutes.ts` with the standard `registerOperationsRoutes(app: Express)` structure.

**Step 2: Move the Route Sections**

Find these five sections in `server/routes.ts`, cut them out, and paste them inside the `registerOperationsRoutes` function:

1.  `// ==================== SHIFT CHECKS (END-OF-SHIFT) ====================` (starts around line 3086)
2.  `// ==================== GPS TRACKING & LOCATION ======================` (starts around line 3526)
3.  `// ==================== GEOFENCING ====================` (starts around line 3626)
4.  `// ==================== STAGNATION ALERTS ====================` (starts around line 4537)
5.  `// ==================== DELIVERY (POD) ROUTES ====================` (starts around line 5413)

**Step 3: Add Necessary Imports**

Copy the required imports from `routes.ts` to the new `operationsRoutes.ts` file.

**Step 4: Register the New Routes**

In `server/routes.ts`, import and call `registerOperationsRoutes(app);`.
```

---

## Prompt 3: Financial & HR Routes

**Goal:** Move all timesheet, pay rate, and wage calculation routes into a new `server/financialRoutes.ts` file.

```
This is the third step in splitting our `routes.ts` file.

Your task is to create a new file, `server/financialRoutes.ts`, and move all financial and HR-related routes into it.

**Step 1: Create the New File**

Create `server/financialRoutes.ts` with the standard `registerFinancialRoutes(app: Express)` structure.

**Step 2: Move the Route Sections**

Find these two large sections in `server/routes.ts`, cut them out, and paste them inside the `registerFinancialRoutes` function:

1.  `// ==================== TIMESHEETS ====================` (starts around line 3690)
2.  `// ==================== PAY RATES & WAGE CALCULATIONS ====================` (starts around line 4124)

**Step 3: Add Necessary Imports**

Copy the required imports from `routes.ts` to the new `financialRoutes.ts` file.

**Step 4: Register the New Routes**

In `server/routes.ts`, import and call `registerFinancialRoutes(app);`.
```

---

## Prompt 4: Settings & Configuration Routes

**Goal:** Move all company and user settings routes into a new `server/settingsRoutes.ts` file.

```
This is the fourth step in splitting our `routes.ts` file.

Your task is to create a new file, `server/settingsRoutes.ts`, and move all settings and configuration routes into it.

**Step 1: Create the New File**

Create `server/settingsRoutes.ts` with the standard `registerSettingsRoutes(app: Express)` structure.

**Step 2: Move the Route Sections**

Find these five sections in `server/routes.ts`, cut them out, and paste them inside the `registerSettingsRoutes` function:

1.  `// ==================== 2FA/TOTP API ROUTES ====================` (starts around line 2525)
2.  `// ==================== COMPANY FEATURE SETTINGS ====================` (starts around line 2831)
3.  `// ==================== GOOGLE DRIVE SETTINGS ====================` (starts around line 2931)
4.  `// ==================== LOGO UPLOAD ====================` (starts around line 3000)
5.  `// Notification Preferences Routes` (starts around line 5194)

**Step 3: Add Necessary Imports**

Copy the required imports from `routes.ts` to the new `settingsRoutes.ts` file.

**Step 4: Register the New Routes**

In `server/routes.ts`, import and call `registerSettingsRoutes(app);`.
```

---

## Prompt 5: Core Feature Routes

**Goal:** Move the remaining core feature routes into a new `server/coreRoutes.ts` file.

```
This is the final major step in splitting our `routes.ts` file.

Your task is to create a new file, `server/coreRoutes.ts`, and move the remaining core feature routes into it.

**Step 1: Create the New File**

Create `server/coreRoutes.ts` with the standard `registerCoreRoutes(app: Express)` structure.

**Step 2: Move the Route Sections**

Find these six sections in `server/routes.ts`, cut them out, and paste them inside the `registerCoreRoutes` function:

1.  `// ==================== AUDIT LOG API ROUTES ====================` (starts around line 2440)
2.  `// ==================== DOCUMENT API ROUTES ====================` (starts around line 2708)
3.  `// ==================== DRIVER MESSAGES ====================` (starts around line 2856)
4.  `// ===== PDF REPORT GENERATION ROUTES =====` (starts around line 3312)
5.  `// ==================== TITAN COMMAND (NOTIFICATIONS) ====================` (starts around line 4573)
6.  `// ==================== REPORT ENDPOINTS ====================` (starts around line 4746)

**Step 3: Add Necessary Imports**

Copy the required imports from `routes.ts` to the new `coreRoutes.ts` file.

**Step 4: Register the New Routes**

In `server/routes.ts`, import and call `registerCoreRoutes(app);`.
```

After completing these 5 prompts, the main `routes.ts` file will be significantly smaller and mostly contain the main login/auth logic and registrations for all the other route files, making it much easier to manage.
