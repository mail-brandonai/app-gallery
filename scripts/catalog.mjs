const origin = 'https://github.com/mail-brandonai/app-gallery/releases/';
export function validateCatalog(catalog) {
  if (!Array.isArray(catalog.apps) || !catalog.apps.length) throw new Error('Catalog must contain apps');
  const ids = new Set();
  for (const app of catalog.apps) {
    if (!/^[a-z][a-z0-9-]*$/.test(app.id) || ids.has(app.id)) throw new Error('Invalid or duplicate app id');
    ids.add(app.id);
    for (const field of ['name', 'description', 'minimumAndroid', 'releasePrefix', 'icon', 'artwork']) {
      if (typeof app[field] !== 'string' || !app[field]) throw new Error(`Missing ${field}`);
    }
    for (const path of [app.icon, app.artwork]) if (!/^assets\/[a-z0-9-]+\.svg$/.test(path)) throw new Error('Unsafe asset path');
    if (app.release) {
      for (const url of [app.release.url, app.release.downloadUrl]) if (!url?.startsWith(origin)) throw new Error('Unexpected release URL');
      if (!app.release.downloadUrl.endsWith('.apk') || !(app.release.size > 0)) throw new Error('Invalid APK metadata');
    }
  }
}
export function syncReleases(catalog, releases) {
  if (!Array.isArray(releases)) throw new Error('Invalid releases response');
  for (const app of catalog.apps) {
    const release = releases.filter(release => !release.draft && !release.prerelease && release.tag_name.startsWith(app.releasePrefix))
      .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)).find(release =>
        release.assets?.some(asset => asset.name === `${app.id}.apk` && asset.state === 'uploaded' && asset.size > 0));
    app.release = null;
    if (!release) continue;
    const apk = release.assets.find(asset => asset.name === `${app.id}.apk` && asset.state === 'uploaded' && asset.size > 0);
    app.release = {
      version: release.tag_name.slice(app.releasePrefix.length), url: release.html_url,
      downloadUrl: apk.browser_download_url, size: apk.size, publishedAt: release.published_at,
      checksum: apk.digest?.startsWith('sha256:') ? apk.digest.slice(7) : null,
    };
  }
}
