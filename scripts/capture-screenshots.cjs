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

  const loginResult = await page.evaluate(async () => {
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
    }

    return { status: res.status, hasManager: !!data.manager };
  });
  console.log('Login result:', JSON.stringify(loginResult));
  await delay(1000);

  const screenshots = [
    { url: '/manager', file: 'dashboard.png' },
    { url: '/manager/inspections', file: 'walkaround.png' },
    { url: '/manager/defects', file: 'defects.png' },
    { url: '/manager/predictive-analytics', file: 'pricing.png' },
  ];

  for (const s of screenshots) {
    console.log(`Navigating to ${s.url}...`);
    await page.goto(`${base}${s.url}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(6000);
    const url = page.url();
    console.log(`  Final URL: ${url}`);
    await page.screenshot({
      path: path.join(__dirname, '..', 'assets', s.file),
      fullPage: false
    });
    console.log(`  Saved ${s.file}`);
  }

  await browser.close();
  console.log('Done!');
}

capture().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
