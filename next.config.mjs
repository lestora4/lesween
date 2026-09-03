import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');

// Files that exist as .html in /public but are NOT real pages
// (leftover snippets / cached API responses), so they're excluded
// from the auto-generated clean-URL rewrites below.
const EXCLUDED = new Set(['index.html', '404.html', 'js.html', 'InitMapsJwt.html']);

// Auto-discover every top-level HTML page in /public and build a
// clean-URL rewrite for it, e.g. public/beijing.html -> /beijing
const pageRewrites = fs
  .readdirSync(publicDir)
  .filter((f) => f.endsWith('.html') && !EXCLUDED.has(f))
  .map((file) => ({
    source: `/${file.replace(/\.html$/, '')}`,
    destination: `/${file}`,
  }));

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      // Runs before Next's own file-system routing, so these always win.
      beforeFiles: [
        { source: '/', destination: '/index.html' },
        ...pageRewrites,
      ],
      // Runs only if nothing else (page, API route, or static file) matched.
      fallback: [{ source: '/:path*', destination: '/404.html' }],
    };
  },
};

export default nextConfig;
