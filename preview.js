const { chromium } = require('playwright');

const THEME_ID = '153670156480';
const STORE   = 'https://15icsx-ru.myshopify.com';
const PREVIEW = `?preview_theme_id=${THEME_ID}`;

const pages = [
  { name: '01-homepage',    path: '/' },
  { name: '02-collection',  path: '/collections/all' },
  { name: '03-cart',        path: '/cart' },
  { name: '04-story',       path: '/pages/our-story' },
  { name: '05-invitation',  path: '/pages/invitation' },
];

(async () => {
  const browser = await chromium.launch({
    headless: false,          // set true to run silently
    proxy: { server: 'http://127.0.0.1:7890' },
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  for (const { name, path } of pages) {
    const url = `${STORE}${path}${PREVIEW}`;
    console.log(`→ ${name}  ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
    console.log(`  ✅ saved screenshots/${name}.png`);
  }

  await browser.close();
  console.log('\nAll done! Open the screenshots/ folder to review.');
})();
