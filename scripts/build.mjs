import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { prepareOfflineShell } from './pwa.mjs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { syncReleases, validateCatalog } from './catalog.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await readFile(resolve(root, 'site/data/apps.json'), 'utf8'));
validateCatalog(catalog);
if (process.env.GITHUB_ACTIONS === 'true') {
  const response = await fetch('https://api.github.com/repos/mail-brandonai/app-gallery/releases?per_page=100', {
    headers: { Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Release discovery failed (${response.status}); refusing to publish stale download metadata.`);
  syncReleases(catalog, await response.json());
}
validateCatalog(catalog);
await rm(resolve(root, 'dist'), { recursive: true, force: true });
await mkdir(resolve(root, 'dist'), { recursive: true });
await cp(resolve(root, 'site'), resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/data/apps.json'), JSON.stringify(catalog, null, 2) + '\n');
const { version, precache, html, worker } = await prepareOfflineShell(resolve(root, 'site'));
await writeFile(resolve(root, 'dist/index.html'), html);
await writeFile(resolve(root, 'dist/sw.js'), worker);
console.log(`Offline shell ${version}: ${precache.length} resources. Release metadata and APKs are never cached.`);
console.log(`Built ${catalog.apps.length} app listing(s). ${catalog.apps.filter(app => app.release).length} downloadable release(s).`);
