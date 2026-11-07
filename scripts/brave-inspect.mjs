import { puppeteer } from '/home/tcb/.npm/_npx/15c61037b1978c83/node_modules/chrome-devtools-mcp/build/src/third_party/index.js';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = '/home/tcb/.gemini/antigravity/brain/2aaede0f-d74c-4adb-8b43-911d9dd46c59';

export async function connectBrave() {
  const portFile = fs.readFileSync('/home/tcb/.config/BraveSoftware/Brave-Browser/DevToolsActivePort', 'utf8');
  const [port, wsPath] = portFile.trim().split('\n');
  const wsEndpoint = `ws://127.0.0.1:${port.trim()}${wsPath.trim()}`;

  const browser = await puppeteer.connect({
    browserWSEndpoint: wsEndpoint,
    defaultViewport: null,
    headers: {
      Host: `127.0.0.1:${port.trim()}`,
      Origin: `http://127.0.0.1:${port.trim()}`,
    },
  });
  return browser;
}

export async function getOrCreateCirclePage(browser) {
  const pages = await browser.pages();
  for (const p of pages) {
    const url = p.url();
    if (url.includes('localhost:3000') || url.includes('127.0.0.1:3000')) {
      return p;
    }
  }
  // If not found, open a new page
  const page = await browser.newPage();
  return page;
}

async function run() {
  const action = process.argv[2] || 'status';
  const param = process.argv[3];

  const browser = await connectBrave();

  try {
    if (action === 'status') {
      const pages = await browser.pages();
      console.log(`Connected to Brave! Active tabs (${pages.length}):`);
      for (let i = 0; i < pages.length; i++) {
        console.log(` [${i}] "${await pages[i].title()}" - ${pages[i].url()}`);
      }
    } else if (action === 'navigate') {
      const page = await getOrCreateCirclePage(browser);
      const targetUrl = param || 'http://localhost:3000';
      console.log(`Navigating to ${targetUrl}...`);
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`Navigation complete: "${await page.title()}"`);
    } else if (action === 'click') {
      const page = await getOrCreateCirclePage(browser);
      const selector = param || '.group.cursor-pointer';
      console.log(`Clicking selector: ${selector}...`);
      await page.waitForSelector(selector, { timeout: 10000 });
      await page.click(selector);
      console.log(`Clicked!`);
    } else if (action === 'screenshot') {
      const page = await getOrCreateCirclePage(browser);
      const filename = param || 'brave_viewport.png';
      const outPath = path.join(ARTIFACT_DIR, filename);
      await page.screenshot({ path: outPath });
      console.log(`Screenshot saved to: ${outPath}`);
    } else if (action === 'full-screenshot') {
      const page = await getOrCreateCirclePage(browser);
      const filename = param || 'brave_fullpage.png';
      const outPath = path.join(ARTIFACT_DIR, filename);
      await page.screenshot({ path: outPath, fullPage: true });
      console.log(`Fullpage screenshot saved to: ${outPath}`);
    } else if (action === 'eval') {
      const page = await getOrCreateCirclePage(browser);
      const expr = param || 'window.location.href';
      const res = await page.evaluate((code) => {
        try {
          return { ok: true, result: eval(code) };
        } catch (err) {
          return { ok: false, error: String(err) };
        }
      }, expr);
      console.log('Eval result:', JSON.stringify(res, null, 2));
    }
  } finally {
    browser.disconnect();
  }
}

if (process.argv[1]?.endsWith('brave-inspect.mjs')) {
  run().catch(console.error);
}
