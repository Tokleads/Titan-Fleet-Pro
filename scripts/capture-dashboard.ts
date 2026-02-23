import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://motion-view--tokleads.replit.app';
const OUTPUT_DIR = path.resolve(__dirname, '../client/public/images/tour');
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();
  
  // Login first
  await page.goto(`${BASE_URL}/manager/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(1500);
  try { await page.click('[data-testid="button-mode-email"]'); await delay(500); } catch {}
  await page.type('[data-testid="input-login-email"]', 'jonbyrne10@googlemail.com');
  await page.type('[data-testid="input-login-password"]', 'Tokleads2026!');
  await page.click('[data-testid="button-login"]');
  await delay(5000);
  
  // The login redirects to /manager which IS the dashboard
  console.log('Current URL:', page.url());
  await page.goto(`${BASE_URL}/manager`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(5000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'dashboard_main.png'), fullPage: false });
  console.log('dashboard_main.png saved');

  // Also capture analytics
  await page.goto(`${BASE_URL}/manager/analytics`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(5000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'dashboard_reports.png'), fullPage: false });
  console.log('dashboard_reports.png saved');

  await browser.close();
}

main().catch(console.error);
