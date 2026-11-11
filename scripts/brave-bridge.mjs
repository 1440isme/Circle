import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { puppeteer } from '/home/tcb/.npm/_npx/15c61037b1978c83/node_modules/chrome-devtools-mcp/out/Default/gen/src/third_party/index.js';

const ARTIFACT_DIR = '/home/tcb/.gemini/antigravity/brain/2aaede0f-d74c-4adb-8b43-911d9dd46c59';
const BRIDGE_PORT = 9333;

let browser = null;
let connectingPromise = null;
const logs = {
  consoleErrors: [],
  pageErrors: [],
  httpErrors: [],
};
const attachedPages = new WeakSet();

function attachListeners(p) {
  if (attachedPages.has(p)) return;
  attachedPages.add(p);
  p.on('pageerror', (err) => {
    logs.pageErrors.push({ time: new Date().toISOString(), message: String(err) });
    if (logs.pageErrors.length > 200) logs.pageErrors.shift();
  });
  p.on('console', (msg) => {
    if (msg.type() === 'error') {
      logs.consoleErrors.push({ time: new Date().toISOString(), text: msg.text() });
      if (logs.consoleErrors.length > 200) logs.consoleErrors.shift();
    }
  });
  p.on('response', (res) => {
    if (res.status() >= 400) {
      logs.httpErrors.push({
        time: new Date().toISOString(),
        status: res.status(),
        url: res.url(),
      });
      if (logs.httpErrors.length > 200) logs.httpErrors.shift();
    }
  });
}

async function getBrowser() {
  if (browser && browser.connected) {
    return browser;
  }
  if (connectingPromise) {
    return connectingPromise;
  }
  connectingPromise = (async () => {
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
  })();
  try {
    return await connectingPromise;
  } finally {
    connectingPromise = null;
  }
}

async function getCirclePage(b) {
  const pages = await b.pages();
  for (const p of pages) {
    const url = p.url();
    if (url.includes('localhost:3000') || url.includes('127.0.0.1:3000')) {
      attachListeners(p);
      return p;
    }
  }
  for (const p of pages) {
    if (p.url() === 'about:blank' || p.url().startsWith('chrome://newtab') || p.url().startsWith('brave://newtab')) {
      attachListeners(p);
      return p;
    }
  }
  const newPage = await b.newPage();
  attachListeners(newPage);
  return newPage;
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
          await page.evaluate(() => {
            document.getAnimations().forEach((anim) => {
              const timing = anim.effect?.getComputedTiming?.();
              if (timing && timing.iterations !== Infinity) {
                try { anim.finish(); } catch {}
              }
            });
          });
          await page.screenshot({ path: outPath, fullPage: Boolean(parsed.fullPage) });
          return send(200, { ok: true, path: outPath });
        }

        if (action === 'setViewport') {
          const width = Number(parsed.width) || 1280;
          const height = Number(parsed.height) || 800;
          await page.setViewport({ width, height, deviceScaleFactor: Number(parsed.dpr) || 1 });
          return send(200, { ok: true, viewport: { width, height } });
        }

        if (action === 'resetViewport') {
          await page.setViewport(null);
          return send(200, { ok: true });
        }

        if (action === 'pressKey') {
          await page.keyboard.press(parsed.key || 'Escape');
          return send(200, { ok: true, key: parsed.key || 'Escape' });
        }

        if (action === 'type') {
          const selector = parsed.selector;
          const text = String(parsed.text || '');
          await page.waitForSelector(selector, { timeout: 5000 });
          await page.focus(selector);
          if (parsed.clear) {
            await page.keyboard.down('Control');
            await page.keyboard.press('a');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
          }
          if (text) {
            await page.keyboard.type(text, { delay: Number(parsed.delay) || 10 });
          }
          return send(200, { ok: true, typed: text.length });
        }

        if (action === 'hover') {
          await page.waitForSelector(parsed.selector, { timeout: 5000 });
          await page.hover(parsed.selector);
          return send(200, { ok: true, hovered: parsed.selector });
        }

        if (action === 'getLogs') {
          return send(200, { ok: true, logs });
        }

        if (action === 'clearLogs') {
          logs.consoleErrors.length = 0;
          logs.pageErrors.length = 0;
          logs.httpErrors.length = 0;
          return send(200, { ok: true });
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
