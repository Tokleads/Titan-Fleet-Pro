import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://motion-view--tokleads.replit.app';
const OUTPUT_DIR = path.resolve(__dirname, '../client/public/images/tour');

const LOGIN_EMAIL = 'jonbyrne10@googlemail.com';
const LOGIN_PASSWORD = 'Tokleads2026!';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();

  // 1. Landing page
  console.log('Capturing landing page...');
  await page.goto(`${BASE_URL}/?marketing=true`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'landing_page.png'), fullPage: false });
  console.log('  -> landing_page.png saved');

  // 2. Login via the manager login form
  console.log('Logging in via manager login form...');
  await page.goto(`${BASE_URL}/manager/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(1500);

  // Click "Login with Email" button if needed
  try {
    await page.click('[data-testid="button-mode-email"]');
    await delay(500);
  } catch {}

  await page.type('[data-testid="input-login-email"]', LOGIN_EMAIL);
  await page.type('[data-testid="input-login-password"]', LOGIN_PASSWORD);
  await page.click('[data-testid="button-login"]');
  await delay(5000);
  console.log('  -> Logged in, current URL:', page.url());

  // Desktop manager screenshots
  const desktopPages = [
    { url: '/manager/dashboard', name: 'dashboard_main.png', label: 'dashboard' },
    { url: '/manager/live-tracking', name: 'dashboard_map.png', label: 'live tracking' },
    { url: '/manager/fleet', name: 'dashboard_fleet.png', label: 'fleet management' },
    { url: '/manager/analytics', name: 'dashboard_reports.png', label: 'analytics' },
    { url: '/manager/inspections', name: 'dashboard_inspections.png', label: 'inspections' },
    { url: '/manager/defects', name: 'dashboard_defects.png', label: 'defects' },
    { url: '/manager/drivers', name: 'dashboard_drivers.png', label: 'drivers' },
    { url: '/manager/timesheets', name: 'dashboard_timesheets.png', label: 'timesheets' },
  ];

  for (const p of desktopPages) {
    console.log(`Capturing ${p.label}...`);
    await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(4000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, p.name), fullPage: false });
    console.log(`  -> ${p.name} saved`);
  }

  // Mobile driver app screens
  console.log('Switching to mobile viewport for driver app...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  const mobilePages = [
    { url: '/app', name: 'driver_app_home.png', label: 'driver app home' },
    { url: '/driver/dashboard', name: 'driver_app_dashboard.png', label: 'driver dashboard' },
    { url: '/driver/inspection', name: 'driver_app_check.png', label: 'driver inspection' },
    { url: '/driver/deliveries', name: 'driver_app_pod.png', label: 'driver deliveries' },
  ];

  for (const p of mobilePages) {
    console.log(`Capturing ${p.label}...`);
    await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, p.name), fullPage: false });
    console.log(`  -> ${p.name} saved`);
  }

  await browser.close();
  console.log('\nAll screenshots captured successfully!');
}

main().catch(console.error);
