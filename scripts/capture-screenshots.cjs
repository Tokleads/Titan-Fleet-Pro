const puppeteer = require('puppeteer');
const path = require('path');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function capture() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const base = 'http://localhost:5000';

  await page.goto(base + '/manager/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  await page.evaluate(async () => {
    const res = await fetch('/api/manager/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ companyCode: 'ABTSO', pin: '1000' })
    });
    const data = await res.json();
    if (data.manager && data.company) {
      localStorage.setItem('fleetcheck_user', JSON.stringify(data.manager));
      localStorage.setItem('fleetcheck_company', JSON.stringify(data.company));
      localStorage.setItem('fleetcheck_session_created_at', String(Date.now()));
      localStorage.setItem('fleetcheck_tour_completed', 'true');
    }
    return data;
  });
  console.log('Login done');
  await delay(1000);

  const screenshots = [
    { url: '/manager', file: 'dashboard.png' },
    { url: '/manager/analytics', file: 'analytics.png' },
    { url: '/manager/inspections', file: 'inspections.png' },
    { url: '/manager/defects', file: 'defects.png' },
    { url: '/manager/live-tracking', file: 'tracking.png' },
    { url: '/manager/fleet', file: 'fleet.png' },
    { url: '/manager/predictive-analytics', file: 'predictive.png' },
    { url: '/manager/timesheets', file: 'timesheets.png' },
    { url: '/manager/fuel-intelligence', file: 'fuel.png' },
  ];

  for (const s of screenshots) {
    console.log(`Capturing ${s.url}...`);
    await page.goto(`${base}${s.url}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(4000);

    // Dismiss any tour/modal popups
    try {
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button')];
        const skip = btns.find(b => b.textContent.includes('Skip Tour') || b.textContent.includes('Skip') || b.textContent.includes('Close'));
        if (skip) skip.click();
        // Also close any X buttons on modals
        const closeBtn = document.querySelector('[aria-label="Close"]');
        if (closeBtn) closeBtn.click();
      });
      await delay(1000);
    } catch(e) {}

    // Close Titan Intelligence sidebar if present
    try {
      await page.evaluate(() => {
        const xBtns = [...document.querySelectorAll('button')];
        const titanClose = xBtns.find(b => {
          const svg = b.querySelector('svg');
          return svg && b.closest('[class*="fixed"]');
        });
        // Click the X on the TITAN INTELLIGENCE panel
        const panel = document.querySelector('.fixed.right-0, [class*="right-0"][class*="fixed"]');
        if (panel) {
          const closeBtn = panel.querySelector('button');
          if (closeBtn) closeBtn.click();
        }
      });
      await delay(1000);
    } catch(e) {}

    await page.screenshot({
      path: path.join(__dirname, '..', 'assets', s.file),
      fullPage: false
    });
    console.log(`  Saved ${s.file}`);
  }

  await browser.close();
  console.log('All screenshots captured!');
}

capture().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
