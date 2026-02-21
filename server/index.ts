import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { startScheduler } from "./scheduler";
import adminRoutes from "./adminRoutes";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
import { populateUser } from './jwtAuth';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Stripe webhook route - MUST be before express.json()
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      
      try {
        const { handlePostCheckout, handleInvoicePaid } = await import('./webhookHandlers');
        await handlePostCheckout(req.body as Buffer, sig);
        await handleInvoicePaid(req.body as Buffer, sig);
      } catch (err) {
        console.error('Post-checkout handler error:', err);
      }
      
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(populateUser);

app.use('/sw.js', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});


export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && res.statusCode >= 400) {
        const redacted = JSON.parse(JSON.stringify(capturedJsonResponse, (key, value) => {
          if (key === "pin" || key === "assignedPin" || key === "password" || key === "token") return "[REDACTED]";
          return value;
        }));
        const bodyStr = JSON.stringify(redacted);
        logLine += ` :: ${bodyStr.length > 500 ? bodyStr.substring(0, 500) + '...' : bodyStr}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize Stripe
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      console.log('Initializing Stripe schema...');
      await runMigrations({ databaseUrl, schema: 'stripe' });
      console.log('Stripe schema ready');

      const stripeSync = await getStripeSync();

      const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
      if (domain) {
        const webhookBaseUrl = `https://${domain}`;
        try {
          const result = await stripeSync.findOrCreateManagedWebhook(
            `${webhookBaseUrl}/api/stripe/webhook`
          );
          console.log(`Stripe webhook configured: ${result?.webhook?.url || 'OK'}`);
        } catch (webhookErr) {
          console.log('Stripe webhook setup deferred (will work after deployment)');
        }
      }

      stripeSync.syncBackfill()
        .then(() => console.log('Stripe data synced'))
        .catch((err: any) => console.error('Error syncing Stripe data:', err));
    }
  } catch (error) {
    console.error('Stripe initialization error (non-fatal):', error);
  }

  // Ensure demo seed data exists
  try {
    const { db } = await import('./db');
    const { companies, users, vehicles } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const existing = await db.select().from(companies).where(eq(companies.companyCode, 'APEX')).limit(1);
    if (existing.length === 0) {
      console.log('Seeding APEX demo company...');
      const existingAny = await db.select().from(companies).limit(1);
      if (existingAny.length > 0 && existingAny[0].companyCode !== 'APEX') {
        await db.update(companies).set({ companyCode: 'APEX', name: 'Apex Transport Ltd' }).where(eq(companies.id, existingAny[0].id));
        const mgr = await db.select().from(users).where(eq(users.companyId, existingAny[0].id));
        for (const u of mgr) {
          if (u.role === 'manager' && !u.pin) {
            await db.update(users).set({ pin: '1234' }).where(eq(users.id, u.id));
          }
        }
        console.log('Updated existing company to APEX');
      } else if (existingAny.length === 0) {
        const [company] = await db.insert(companies).values({
          companyCode: 'APEX',
          name: 'Apex Transport Ltd',
          primaryColor: '#2563eb',
          licenseTier: 'core',
          vehicleAllowance: 15,
          graceOverage: 3,
          enforcementMode: 'soft_block',
          settings: { fuelEnabled: true, podEnabled: true, primaryColor: '#2563eb', brandName: 'Demo Fleet' }
        }).returning();
        const bcrypt = await import('bcrypt');
        const demoPw = process.env.DEMO_SEED_PASSWORD || 'ChangeMeOnSetup1!';
        const hashedPw = await bcrypt.default.hash(demoPw, 10);
        const demoPin = process.env.DEMO_SEED_PIN || '1234';
        await db.insert(users).values({ companyId: company.id, email: 'demo@titanfleet.co.uk', name: 'Demo Manager', role: 'manager', pin: demoPin, password: hashedPw });
        await db.insert(users).values({ companyId: company.id, email: 'driver1@apex.com', name: 'John Driver', role: 'driver', pin: demoPin, password: hashedPw });
        await db.insert(users).values({ companyId: company.id, email: 'driver2@apex.com', name: 'Jane Driver', role: 'driver', pin: demoPin, password: hashedPw });
        console.log('Created APEX demo company with users');
      }
    } else {
      const mgr = await db.select().from(users).where(eq(users.companyId, existing[0].id));
      for (const u of mgr) {
        if (u.role === 'manager' && !u.pin) {
          await db.update(users).set({ pin: '1234' }).where(eq(users.id, u.id));
          console.log('Fixed manager PIN for APEX company (updated)');
        }
      }
    }
  } catch (seedErr) {
    console.error('Demo seed check (non-fatal):', seedErr);
  }

  // One-time ABTSO migration: company code, driver PINs, and Robert as Transport Manager
  // Uses a database flag table to ensure it only runs once per database
  try {
    const { db } = await import('./db');
    const { companies, users } = await import('@shared/schema');
    const { eq, and, sql, isNull } = await import('drizzle-orm');

    await db.execute(sql`CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )`);

    const migrationName = 'abtso_initial_setup_v1';
    const existingMigrations = await db.execute(sql`SELECT name FROM _migrations WHERE name = ${migrationName}`);
    const alreadyRan = existingMigrations.rows && existingMigrations.rows.length > 0;
    
    if (!alreadyRan) {
      console.log('[Migration] Running ABTSO initial setup...');
      
      const [abtsoCompany] = await db.select().from(companies)
        .where(sql`${companies.name} = 'ABTSO' OR ${companies.companyCode} = 'ABTSO' OR ${companies.companyCode} = 'PMRB' OR ${companies.contactEmail} = 'monikaabtso@gmail.com'`)
        .limit(1);
      if (abtsoCompany) {
        if (abtsoCompany.companyCode !== 'ABTSO') {
          await db.update(companies).set({ companyCode: 'ABTSO' }).where(eq(companies.id, abtsoCompany.id));
          console.log('[Migration] Updated company code to ABTSO');
        }

        const [robert] = await db.select().from(users)
          .where(and(eq(users.email, 'abtsorobert@gmail.com'), eq(users.companyId, abtsoCompany.id)))
          .limit(1);
        if (robert && robert.role !== 'TRANSPORT_MANAGER') {
          await db.update(users).set({ role: 'TRANSPORT_MANAGER' }).where(eq(users.id, robert.id));
          console.log('[Migration] Promoted Robert Bekas to TRANSPORT_MANAGER');
        }
        if (robert && !robert.pin) {
          await db.update(users).set({ pin: '1000' }).where(eq(users.id, robert.id));
          console.log('[Migration] Set Robert PIN');
        }

        const driversWithoutPin = await db.select({ id: users.id, name: users.name }).from(users)
          .where(and(
            eq(users.companyId, abtsoCompany.id),
            eq(users.role, 'DRIVER'),
            isNull(users.pin)
          ))
          .orderBy(users.name);

        if (driversWithoutPin.length > 0) {
          const existingPins = await db.select({ pin: users.pin }).from(users)
            .where(and(eq(users.companyId, abtsoCompany.id), sql`${users.pin} IS NOT NULL`));
          let nextPin = 1001;
          const usedPins = new Set(existingPins.map(p => p.pin));
          for (const driver of driversWithoutPin) {
            while (usedPins.has(String(nextPin).padStart(4, '0'))) nextPin++;
            const pinStr = String(nextPin).padStart(4, '0');
            await db.update(users).set({ pin: pinStr }).where(eq(users.id, driver.id));
            usedPins.add(pinStr);
            nextPin++;
          }
          console.log(`[Migration] Assigned PINs to ${driversWithoutPin.length} drivers`);
        }

        await db.execute(sql`INSERT INTO _migrations (name) VALUES (${migrationName})`);
        console.log('[Migration] ABTSO initial setup complete — will not run again');
      }
    }
  } catch (abtsoErr) {
    console.error('ABTSO migration (non-fatal):', abtsoErr);
  }

  try {
    const { db: db2 } = await import('./db');
    const { companies: companies2, users: users2 } = await import('@shared/schema');
    const { eq: eq2, and: and2, sql: sql2, isNull: isNull2 } = await import('drizzle-orm');

    const migrationName2 = 'abtso_assign_missing_pins_v2';
    const existing2 = await db2.execute(sql2`SELECT name FROM _migrations WHERE name = ${migrationName2}`);
    if (!existing2.rows || existing2.rows.length === 0) {
      const [abtsoCompany] = await db2.select().from(companies2)
        .where(sql2`${companies2.companyCode} = 'ABTSO'`).limit(1);
      if (abtsoCompany) {
        const usersWithoutPin = await db2.select({ id: users2.id, name: users2.name, role: users2.role }).from(users2)
          .where(and2(eq2(users2.companyId, abtsoCompany.id), isNull2(users2.pin)));
        if (usersWithoutPin.length > 0) {
          const existingPins = await db2.select({ pin: users2.pin }).from(users2)
            .where(and2(eq2(users2.companyId, abtsoCompany.id), sql2`${users2.pin} IS NOT NULL`));
          const usedPins = new Set(existingPins.map(p => p.pin));
          let nextPin = 1001;
          for (const u of usersWithoutPin) {
            while (usedPins.has(String(nextPin))) nextPin++;
            await db2.update(users2).set({ pin: String(nextPin) }).where(eq2(users2.id, u.id));
            usedPins.add(String(nextPin));
            nextPin++;
          }
        }
        await db2.execute(sql2`INSERT INTO _migrations (name) VALUES (${migrationName2})`);
        console.log('[Migration v2] Assigned PINs to all remaining users without PINs');
      }
    }
  } catch (migErr2) {
    console.error('Migration v2 (non-fatal):', migErr2);
  }

  // Migration v3: Create Jon Byrne test driver account
  try {
    const { db: db3 } = await import('./db');
    const { companies: companies3, users: users3 } = await import('@shared/schema');
    const { sql: sql3 } = await import('drizzle-orm');

    const migrationName3 = 'abtso_create_jon_byrne_driver_v3';
    const existing3 = await db3.execute(sql3`SELECT name FROM _migrations WHERE name = ${migrationName3}`);
    if (!existing3.rows || existing3.rows.length === 0) {
      const [abtsoCompany3] = await db3.select().from(companies3)
        .where(sql3`UPPER(TRIM(${companies3.companyCode})) = 'ABTSO'`).limit(1);
      if (abtsoCompany3) {
        const existingUser = await db3.execute(
          sql3`SELECT id FROM users WHERE company_id = ${abtsoCompany3.id} AND pin = '1184'`
        );
        if (!existingUser.rows || existingUser.rows.length === 0) {
          await db3.execute(sql3`
            INSERT INTO users (company_id, email, name, role, pin, active)
            VALUES (${abtsoCompany3.id}, 'jonbyrne.driver@abtso.co.uk', 'Jon Byrne', 'DRIVER', '1184', true)
          `);
          console.log('[Migration v3] Created Jon Byrne driver account');
        } else {
          console.log('[Migration v3] Jon Byrne driver account already exists');
        }
      }
      await db3.execute(sql3`INSERT INTO _migrations (name) VALUES (${migrationName3})`);
    }
  } catch (migErr3) {
    console.error('Migration v3 (non-fatal):', migErr3);
  }

  // Register admin routes
  app.use("/api/admin", adminRoutes);

  // Register fuel intelligence routes
  const { registerFuelIntelligenceRoutes } = await import("./fuelIntelligenceRoutes");
  registerFuelIntelligenceRoutes(app);
  
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  app.get('/clear-cache', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Clearing Cache...</title>
<style>body{font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f1f5f9;color:#1e293b}
.box{text-align:center;padding:2rem;background:#fff;border-radius:1rem;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:400px;width:90%}
h2{margin:0 0 0.5rem}p{color:#64748b;margin:0.5rem 0}
.spin{display:inline-block;width:40px;height:40px;border:4px solid #e2e8f0;border-top-color:#5B6CFF;border-radius:50%;animation:s 0.8s linear infinite;margin-bottom:1rem}
@keyframes s{to{transform:rotate(360deg)}}
.done{color:#16a34a;font-weight:600;display:none}
</style></head><body><div class="box">
<div class="spin" id="spinner"></div>
<h2>Updating Titan Fleet</h2>
<p id="status">Clearing cached data...</p>
<p class="done" id="done">Done! Redirecting...</p>
<script>
(async function(){
  var status=document.getElementById('status');
  try{
    if('serviceWorker' in navigator){
      var regs=await navigator.serviceWorker.getRegistrations();
      for(var r of regs){await r.unregister();}
      status.textContent='Service worker removed...';
    }
    var names=await caches.keys();
    for(var n of names){await caches.delete(n);}
    status.textContent='Caches cleared...';
    localStorage.setItem('titan_sw_version','v9');
  }catch(e){
    status.textContent='Error: '+e.message;
  }
  document.getElementById('spinner').style.display='none';
  document.getElementById('done').style.display='block';
  status.style.display='none';
  setTimeout(function(){window.location.href='/';},1500);
})();
</script></div></body></html>`);
  });

  app.get('/api/clear-cache', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Clearing Cache...</title>
<style>body{font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f1f5f9;color:#1e293b}
.box{text-align:center;padding:2rem;background:#fff;border-radius:1rem;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:400px;width:90%}
h2{margin:0 0 0.5rem}p{color:#64748b;margin:0.5rem 0}
.spin{display:inline-block;width:40px;height:40px;border:4px solid #e2e8f0;border-top-color:#5B6CFF;border-radius:50%;animation:s 0.8s linear infinite;margin-bottom:1rem}
@keyframes s{to{transform:rotate(360deg)}}
.done{color:#16a34a;font-weight:600;display:none}
</style></head><body><div class="box">
<div class="spin" id="spinner"></div>
<h2>Updating Titan Fleet</h2>
<p id="status">Clearing cached data...</p>
<p class="done" id="done">Done! Redirecting...</p>
<script>
(async function(){
  var status=document.getElementById('status');
  try{
    if('serviceWorker' in navigator){
      var regs=await navigator.serviceWorker.getRegistrations();
      for(var r of regs){await r.unregister();}
      status.textContent='Service worker removed...';
    }
    var names=await caches.keys();
    for(var n of names){await caches.delete(n);}
    status.textContent='Caches cleared...';
    localStorage.setItem('titan_sw_version','v9');
  }catch(e){
    status.textContent='Error: '+e.message;
  }
  document.getElementById('spinner').style.display='none';
  document.getElementById('done').style.display='block';
  status.style.display='none';
  setTimeout(function(){window.location.href='/';},1500);
})();
</script></div></body></html>`);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      
      // Start the notification scheduler
      startScheduler();
      log('Notification scheduler started', 'scheduler');
    },
  );
})();
