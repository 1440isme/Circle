import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { puppeteer } from '/home/tcb/.npm/_npx/15c61037b1978c83/node_modules/chrome-devtools-mcp/build/src/third_party/index.js';

const ARTIFACT_DIR = '/home/tcb/.gemini/antigravity/brain/2aaede0f-d74c-4adb-8b43-911d9dd46c59';
const BRIDGE_PORT = 9333;

let browser = null;

async function getBrowser() {
  if (browser && browser.connected) {
    return browser;
  }
  const portFile = fs.readFileSync('/home/tcb/.config/BraveSoftware/Brave-Browser/DevToolsActivePort', 'utf8');
  const [port, wsPath] = portFile.trim().split('\n');
  const wsEndpoint = `ws://127.0.0.1:${port.trim()}${wsPath.trim()}`;

  console.log(`[Bridge] Connecting to Brave at ${wsEndpoint}...`);
  browser = await puppeteer.connect({
    browserWSEndpoint: wsEndpoint,
    defaultViewport: null,
    headers: {
      Host: `127.0.0.1:${port.trim()}`,
      Origin: `http://127.0.0.1:${port.trim()}`,
    },
  });
  console.log(`[Bridge] Connected to Brave successfully! Session kept permanently alive.`);
  return browser;
}

async function getCirclePage(b) {
  const pages = await b.pages();
  for (const p of pages) {
    const url = p.url();
    if (url.includes('localhost:3000') || url.includes('127.0.0.1:3000')) {
      return p;
    }
  }
  return pages[0] || (await b.newPage());
}

const server = http.createServer(async (req, res) => {
  const send = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  try {
    const b = await getBrowser();
    const page = await getCirclePage(b);

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      let parsed = {};
      try {
        if (body) parsed = JSON.parse(body);
      } catch {}

      const url = new URL(req.url, `http://localhost:${BRIDGE_PORT}`);
      const action = url.pathname.replace(/^\//, '');

      try {
        if (action === 'status') {
          const pages = await b.pages();
          const list = [];
          for (let i = 0; i < pages.length; i++) {
            list.push({ index: i, title: await pages[i].title(), url: pages[i].url() });
          }
          return send(200, { ok: true, pages: list });
        }

        if (action === 'eval') {
          const expr = parsed.expr || 'window.location.href';
          const result = await page.evaluate((code) => {
            try {
              return { ok: true, result: eval(code) };
            } catch (err) {
              return { ok: false, error: String(err) };
            }
          }, expr);
          return send(200, result);
        }

        if (action === 'click') {
          const selector = parsed.selector;
          await page.waitForSelector(selector, { timeout: 10000 });
          await page.click(selector);
          return send(200, { ok: true, clicked: selector });
        }

        if (action === 'navigate') {
          const target = parsed.url || 'http://localhost:3000';
          await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
          return send(200, { ok: true, title: await page.title(), url: page.url() });
        }

        if (action === 'screenshot') {
          const filename = parsed.filename || 'viewport.png';
          const outPath = path.join(ARTIFACT_DIR, filename);
          await page.screenshot({ path: outPath, fullPage: Boolean(parsed.fullPage) });
          return send(200, { ok: true, path: outPath });
        }

        send(404, { error: 'Unknown action: ' + action });
      } catch (err) {
        send(500, { ok: false, error: err.message, stack: err.stack });
      }
    });
  } catch (err) {
    send(500, { ok: false, error: err.message });
  }
});

server.listen(BRIDGE_PORT, '127.0.0.1', async () => {
  console.log(`[Bridge] Server listening on http://127.0.0.1:${BRIDGE_PORT}`);
  try {
    await getBrowser();
  } catch (e) {
    console.error('[Bridge] Initial connect error:', e.message);
  }
});
