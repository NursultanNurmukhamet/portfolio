// Minimal static server for local preview of dist/ (no dependencies).
// Usage: node scripts/serve-dist.mjs [port]
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {join, extname, normalize} from 'node:path';

const root = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const port = Number(process.argv[2]) || 4173;
const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'};

createServer(async (request, response) => {
  try {
    let path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (path.startsWith('/portfolio/')) path = path.slice('/portfolio'.length);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(root, path));
    if (!file.startsWith(normalize(root))) throw new Error('outside');
    const info = await stat(file);
    const target = info.isDirectory() ? join(file, 'index.html') : file;
    const body = await readFile(target);
    response.writeHead(200, {'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    response.end(body);
  } catch {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.end('not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`dist/ at http://127.0.0.1:${port}/`));
