import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat, mkdtemp, cp, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareOfflineShell } from './pwa.mjs';
const site = fileURLToPath(new URL('../site', import.meta.url));
const shell = await prepareOfflineShell(site);
function harness(scope) {
  const events = new Map(), stores = new Map();
  const deleted = [], network = [];
  let claimed = false, skipped = false;
  const key = request => typeof request === 'string' ? request : request.url;
  function cache(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const values = stores.get(name);
    return {
      async addAll(requests) { for (const request of requests) values.set(key(request), new Response('cached: ' + key(request))); },
      async match(request) { return values.get(key(request))?.clone(); },
    };
  }
  const context = {
    URL, Request, Response, Set,
    self: { registration: { scope }, clients: { async claim() { claimed = true; } }, skipWaiting() { skipped = true; }, addEventListener(name, handler) { events.set(name, handler); } },
    caches: { async open(name) { return cache(name); }, async keys() { return [...stores.keys()]; }, async delete(name) { deleted.push(name); return stores.delete(name); } },
    async fetch(request) { network.push(key(request)); throw new TypeError('Offline'); },
  };
  vm.runInNewContext(shell.worker, context);
  return {
    stores, deleted, network, get claimed() { return claimed; }, get skipped() { return skipped; },
    async lifecycle(name) { let work; events.get(name)({waitUntil(promise) { work = promise; }}); await work; },
    message(data) { events.get('message')({data}); },
    async request(url, options = {}) {
      let result;
      events.get('fetch')({request: {url, method:'GET', mode:'cors', ...options}, respondWith(promise) { result = promise; }});
      return result ? { intercepted:true, response: await result } : {intercepted:false};
    },
  };
}
test('manifest is path-relative, standalone and has real PNG icons of declared sizes', async () => {
  const manifest = JSON.parse(await readFile(new URL('../site/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.start_url, './'); assert.equal(manifest.scope, './'); assert.equal(manifest.id, './');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
  for (const icon of manifest.icons) {
    const bytes = await readFile(new URL(`../site/${icon.src}`, import.meta.url));
    assert.equal(bytes.subarray(1,4).toString(), 'PNG');
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, icon.sizes);
  }
});
test('all precached resources exist and shell references match their immutable version', async () => {
  assert.match(shell.version, /^[a-f0-9]{16}$/);
  for (const path of shell.precache) {
    await stat(new URL(`../site/${path.split('?')[0]}`, import.meta.url));
    assert.ok(!path.startsWith('data/')); assert.ok(!path.endsWith('.apk'));
  }
  for (const script of ['app.js','pwa.js','styles.css']) assert.ok(shell.html.includes(`${script}?v=${shell.version}`));
  assert.ok(!shell.worker.includes('__PRECACHE__'));
  assert.equal(shell.version, (await prepareOfflineShell(site)).version);
});
for (const scope of ['https://apps.example.com/', 'https://example.github.io/app-gallery/']) {
  test(`offline shell navigation, assets and exclusions work under ${scope}`, async () => {
    const h = harness(scope); await h.lifecycle('install');
    const page = await h.request(scope + '?source=installed', {mode:'navigate'});
    assert.equal(page.intercepted, true); assert.ok((await page.response.text()).includes('index.html?v='));
    const asset = await h.request(new URL(`app.js?v=${shell.version}`, scope).href);
    assert.equal(asset.intercepted, true);
    for (const url of [new URL('data/apps.json',scope).href, new URL('data/apps.json?fresh=1',scope).href, new URL('download.apk',scope).href, 'https://github.com/mail-brandonai/app-gallery/releases/download/ascent-v0.2.0/ascent.apk', new URL('unknown.js',scope).href]) {
      assert.equal((await h.request(url)).intercepted, false);
    }
    assert.equal((await h.request(new URL(`app.js?v=${shell.version}`,scope).href,{method:'POST'})).intercepted,false);
    assert.deepEqual(h.network, []);
  });
}
test('activation deletes only older Gallery caches and update activation requires a message', async () => {
  const h = harness('https://apps.example.com/'); await h.lifecycle('install');
  h.stores.set('liquid-synthetics-gallery-old',new Map()); h.stores.set('another-app-cache',new Map());
  assert.equal(h.skipped,false); h.message({type:'unrelated'}); assert.equal(h.skipped,false);
  h.message({type:'SKIP_WAITING'}); assert.equal(h.skipped,true);
  await h.lifecycle('activate');
  assert.deepEqual(h.deleted,['liquid-synthetics-gallery-old']); assert.equal(h.claimed,true);
  assert.ok(h.stores.has('another-app-cache'));
});

test('shell changes create updates while release-only changes do not', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'gallery-pwa-'));
  try {
    await cp(site, temp, {recursive:true});
    await writeFile(join(temp,'data/apps.json'), '{"apps":[]}');
    assert.equal((await prepareOfflineShell(temp)).version, shell.version);
    await writeFile(join(temp,'app.js'), (await readFile(join(temp,'app.js'),'utf8')) + '\n// New interface version\n');
    assert.notEqual((await prepareOfflineShell(temp)).version, shell.version);
  } finally { await rm(temp,{recursive:true,force:true}); }
});
