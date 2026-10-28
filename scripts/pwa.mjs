import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
export async function prepareOfflineShell(site) {
  const assets = (await readdir(resolve(site, 'assets'))).sort().map(name => `assets/${name}`);
  const shellFiles = ['index.html', 'app.js', 'pwa.js', 'styles.css', 'manifest.webmanifest', 'sw.js', ...assets];
  const hash = createHash('sha256');
  for (const path of shellFiles) { hash.update(path); hash.update(await readFile(resolve(site, path))); }
  const version = hash.digest('hex').slice(0, 16);
  const versioned = ['app.js', 'pwa.js', 'styles.css'];
  let html = await readFile(resolve(site, 'index.html'), 'utf8');
  for (const path of versioned) html = html.replaceAll(`"${path}"`, `"${path}?v=${version}"`);
  const precache = [`index.html?v=${version}`, 'manifest.webmanifest', ...versioned.map(path => `${path}?v=${version}`), ...assets];
  const worker = (await readFile(resolve(site, 'sw.js'), 'utf8'))
    .replace('__CACHE_VERSION__', version).replace('__PRECACHE__', JSON.stringify(precache));
  return { version, precache, html, worker };
}
