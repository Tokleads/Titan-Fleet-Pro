import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { startScheduler } from "./scheduler";
import adminRoutes from "./adminRoutes";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';

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
        const { handlePostCheckout } = await import('./webhookHandlers');
        await handlePostCheckout(req.body as Buffer, sig);
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
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
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
        const hashedPw = await bcrypt.default.hash('1234TF', 10);
        await db.insert(users).values({ companyId: company.id, email: 'demo@titanfleet.co.uk', name: 'Demo Manager', role: 'manager', pin: '1234', password: hashedPw });
        await db.insert(users).values({ companyId: company.id, email: 'driver1@apex.com', name: 'John Driver', role: 'driver', pin: '1234', password: hashedPw });
        await db.insert(users).values({ companyId: company.id, email: 'driver2@apex.com', name: 'Jane Driver', role: 'driver', pin: '1234', password: hashedPw });
        console.log('Created APEX demo company with users');
      }
    } else {
      const mgr = await db.select().from(users).where(eq(users.companyId, existing[0].id));
      for (const u of mgr) {
        if (u.role === 'manager' && !u.pin) {
          await db.update(users).set({ pin: '1234' }).where(eq(users.id, u.id));
          console.log('Fixed manager PIN for APEX company');
        }
      }
    }
  } catch (seedErr) {
    console.error('Demo seed check (non-fatal):', seedErr);
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
