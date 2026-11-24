require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const port = process.env.PORT || 3000;
const origins = (process.env.CLIENT_ORIGINS || '')
  .split(',').map(value => value.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow API clients and local setup when no browser origins have been configured.
    if (!origin || origins.length === 0 || origins.includes(origin)) return callback(null, true);
    return callback(new Error('This browser origin is not allowed by the API.'));
  }
}));
app.use(express.json({ limit: '20kb' }));

const projectName = 'Mulungushi University Study Support Requests API';

app.get('/', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${projectName}</title><style>
:root{color-scheme:light;--ink:#252525;--paper:#f5f2ea;--orange:#f36b32;--muted:#777}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif}.wrap{max-width:1000px;margin:48px auto;padding:0 22px}.top{border-left:6px solid var(--orange);padding:8px 0 8px 22px}h1{font-size:clamp(1.8rem,4vw,2.8rem);line-height:1.15;margin:0 0 10px}h2{font-size:1.2rem;margin-top:32px}.muted{color:var(--muted)}.panel{background:#fff;border:1px solid #e6e1d7;border-radius:14px;padding:22px;margin-top:22px;overflow-x:auto}a{color:#b94719;text-decoration-thickness:1px;text-underline-offset:3px}code,pre{background:#f2f0eb;border-radius:5px;padding:3px 6px}pre{padding:14px;overflow:auto}table{width:100%;border-collapse:collapse;min-width:540px}th,td{text-align:left;padding:11px;border-bottom:1px solid #e9e6df}th{background:#f7f5f0}th:first-child,td:first-child{white-space:nowrap}.pill{display:inline-block;background:#252525;color:#fff;padding:4px 9px;border-radius:99px;font-size:.8rem}.footer{margin:30px 0;color:var(--muted);font-size:.9rem}
</style></head><body><main class="wrap"><header class="top"><span class="pill">ICT251 · ACTIVITY 7</span><h1>${projectName}</h1><p class="muted">An independent REST API for students to submit and track academic support requests.</p></header>
<section class="panel"><h2>Project information</h2><p><strong>Student:</strong> 202508154</p><p><strong>System:</strong> Study Support Requests</p><p><strong>Base URL:</strong> <a href="${base}">${base}</a></p><p><strong>Health check:</strong> <a href="${base}/health">${base}/health</a></p><p><strong>All records:</strong> <a href="${base}/api/records">${base}/api/records</a></p></section>
<section class="panel"><h2>Available API routes</h2><table><thead><tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr></thead><tbody>
<tr><td>GET</td><td><code>/</code></td><td>API guide</td></tr><tr><td>GET</td><td><code>/health</code></td><td>Check API and database</td></tr><tr><td>GET</td><td><code>/api/records</code></td><td>List all records</td></tr><tr><td>GET</td><td><code>/api/records/:id</code></td><td>Get one record</td></tr><tr><td>POST</td><td><code>/api/records</code></td><td>Create a record</td></tr><tr><td>PUT</td><td><code>/api/records/:id</code></td><td>Replace a record's editable fields</td></tr><tr><td>DELETE</td><td><code>/api/records/:id</code></td><td>Delete a record</td></tr></tbody></table></section>
<section class="panel"><h2>Record format</h2><p>POST and PUT require all four editable fields. Do not send an <code>id</code>; the database generates it.</p><p><strong>Field rules:</strong> title 3–80 characters; category 2–40; description 5–300. Text is trimmed before validation.</p><p><strong>Allowed statuses:</strong> Pending, In progress, Completed.</p><pre>{
  "title": "Help with JavaScript arrays",
  "category": "Programming",
  "description": "I need help understanding array methods and iteration.",
  "status": "Pending"
}</pre></section>
<section class="panel"><h2>Response codes</h2><p><code>200</code> successful read, update or delete · <code>201</code> record created · <code>400</code> invalid input, ID or malformed JSON · <code>404</code> record or route not found · <code>500</code> unexpected server error · <code>503</code> database health check failed.</p><p class="muted">A hosted service may pause while idle. Its first request can take a little longer while the service starts.</p></section>
<p class="footer">Mulungushi University · School of Engineering and Technology · Computer Science Department</p></main></body></html>`);
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({ status: 'error', database: 'unavailable', message: 'Database check failed.' });
  }
});

app.use('/api/records', require('./routes/records'));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Malformed JSON request body.' });
  }
  if (error.message && error.message.includes('browser origin is not allowed')) {
    return res.status(403).json({ message: 'This browser origin is not allowed.' });
  }
  console.error('Server error:', error);
  return res.status(500).json({ message: 'An unexpected server error occurred.' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Study Support Requests API listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
