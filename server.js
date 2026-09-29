const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = __dirname;
const DB_FILE = path.join(ROOT, 'db.json');
const PORT = Number(process.env.PORT || 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm'
};

function send(res, status, body, type='text/plain; charset=utf-8') {
  res.writeHead(status, {'Content-Type': type, 'Cache-Control': 'no-store'});
  res.end(body);
}

function readDb() {
  if (!fs.existsSync(DB_FILE)) return { series: [], movies: [] };
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  const pathname = decodeURIComponent(parsed.pathname || '/');

  if (pathname === '/api/health') {
    return send(res, 200, JSON.stringify({ ok: true, db: DB_FILE }), 'application/json; charset=utf-8');
  }

  if (pathname === '/api/db') {
    try {
      return send(res, 200, JSON.stringify(readDb()), 'application/json; charset=utf-8');
    } catch (err) {
      return send(res, 500, JSON.stringify({ error: 'Could not read db.json', detail: err.message }), 'application/json; charset=utf-8');
    }
  }

  let filePath = pathname === '/' ? path.join(ROOT, 'index.html') : path.join(ROOT, pathname.replace(/^\/+/, ''));
  filePath = path.normalize(filePath);
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, 'Not found');
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.json' ? 'no-store' : 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`StreamVibe running at http://localhost:${PORT}`);
  console.log(`JSON API: http://localhost:${PORT}/api/db`);
});
