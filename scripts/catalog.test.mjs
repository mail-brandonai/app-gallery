import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { syncReleases, validateCatalog } from './catalog.mjs';
const catalog = () => ({ apps: [{ id: 'daylight', name: 'Daylight', description: 'Weather', minimumAndroid: '8.0', releasePrefix: 'daylight-v', icon: 'assets/daylight-icon.svg', artwork: 'assets/daylight-day.svg', release: null }] });
const release = (tag, extra = {}) => ({ tag_name: tag, published_at: '2026-10-27T12:00:00Z', html_url: `https://github.com/mail-brandonai/app-gallery/releases/tag/${tag}`, assets: [{name: 'daylight.apk', state: 'uploaded', size: 1234, browser_download_url: `https://github.com/mail-brandonai/app-gallery/releases/download/${tag}/daylight.apk`, digest: 'sha256:abcd'}], ...extra });
test('independent app tags ignore other apps, drafts and prereleases', () => {
 const data = catalog(); syncReleases(data, [release('other-v2'), release('daylight-v3', {draft:true}), release('daylight-v2', {prerelease:true}), release('daylight-v1')]);
 assert.equal(data.apps[0].release.version, '1'); validateCatalog(data);
});
test('no uploaded APK means no advertised download', () => {
 const data = catalog(); syncReleases(data, [release('daylight-v1', { assets: [] })]); assert.equal(data.apps[0].release, null);
});
test('unsafe external release URLs cannot be published', () => {
 const data = catalog(); syncReleases(data, [release('daylight-v1', {html_url:'https://example.com'})]); assert.throws(() => validateCatalog(data));
});
test('newest eligible app release wins and removing releases clears stale metadata', () => {
 const data = catalog(); syncReleases(data, [release('daylight-v1'), release('daylight-v2', {published_at:'2026-10-28T12:00:00Z'})]);
 assert.equal(data.apps[0].release.version, '2'); syncReleases(data, []); assert.equal(data.apps[0].release, null);
});
test('all catalog assets exist', async () => {
 const data = JSON.parse(await readFile(new URL('../site/data/apps.json', import.meta.url), 'utf8')); validateCatalog(data);
 for (const app of data.apps) for (const path of [app.icon, app.artwork]) await readFile(new URL(`../site/${path}`, import.meta.url));
});
test('Daylight and Ascent select independent APKs and checksums', () => {
 const data = catalog();
 data.apps.push({...data.apps[0], id:'ascent', name:'Ascent', releasePrefix:'ascent-v'});
 const ascent = release('ascent-v0.2.0', { assets:[{ name:'ascent.apk', state:'uploaded', size:5000, browser_download_url:'https://github.com/mail-brandonai/app-gallery/releases/download/ascent-v0.2.0/ascent.apk', digest:'sha256:'+'a'.repeat(64) }] });
 syncReleases(data, [release('daylight-v0.1.0'), ascent]); validateCatalog(data);
 assert.equal(data.apps[0].release.version, '0.1.0');
 assert.ok(data.apps[0].release.downloadUrl.endsWith('/daylight.apk'));
 assert.equal(data.apps[1].release.version, '0.2.0');
 assert.ok(data.apps[1].release.downloadUrl.endsWith('/ascent.apk'));
 assert.equal(data.apps[1].release.checksum, 'a'.repeat(64));
 syncReleases(data, [release('daylight-v0.1.0')]);
 assert.ok(data.apps[0].release); assert.equal(data.apps[1].release, null);
});
