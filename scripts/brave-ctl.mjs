import http from 'node:http';

const BRIDGE_PORT = 9333;
const action = process.argv[2] || 'status';
const arg = process.argv[3] || '';

const arg2 = process.argv[4] || '';

let payload = {};
if (action === 'eval') payload = { expr: arg };
else if (action === 'click') payload = { selector: arg };
else if (action === 'hover') payload = { selector: arg };
else if (action === 'pressKey') payload = { key: arg || 'Escape' };
else if (action === 'setViewport') payload = { width: Number(arg) || 1280, height: Number(arg2) || 800 };
else if (action === 'navigate') payload = { url: arg };
else if (action === 'screenshot') payload = { filename: arg };

const postData = JSON.stringify(payload);

const req = http.request({
  hostname: '127.0.0.1',
  port: BRIDGE_PORT,
  path: `/${action}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
}, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch {
      console.log(data);
    }
  });
});

req.on('error', (err) => {
  console.error('[CTL Error]:', err.message);
  process.exit(1);
});

req.write(postData);
req.end();
