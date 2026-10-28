const home = document.querySelector('#home-view');
const details = [...document.querySelectorAll('[data-detail]')];
const search = document.querySelector('#search');
let category = 'all';
let apps = [...document.querySelectorAll('[data-app]')].map(card => ({ id: card.dataset.app, name: card.querySelector('h3').textContent, category: card.dataset.app === 'daylight' ? 'Weather' : 'Productivity', description: card.textContent, release: null }));
let previousApp = null;
function route() {
  const hash = location.hash;
  const appId = hash.startsWith('#app/') ? hash.slice(5) : hash.startsWith('#ascent-') ? 'ascent' : ['#daylight-features', '#release-info'].includes(hash) ? 'daylight' : null;
  const selected = details.find(view => view.dataset.detail === appId);
  home.hidden = !!selected;
  for (const view of details) view.hidden = view !== selected;
  const name = apps.find(app => app.id === appId)?.name;
  document.title = selected && name ? `${name} — App Gallery` : 'App Gallery — Liquid Synthetics';
  if (selected && previousApp !== appId) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const heading = selected.querySelector('h1'); heading.tabIndex = -1; heading.focus({ preventScroll: true });
  } else if (hash && !hash.startsWith('#app/')) {
    requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
  } else window.scrollTo({ top: 0, behavior: 'instant' });
  previousApp = selected ? appId : null;
}
function filter() {
  const query = search.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const card of document.querySelectorAll('[data-app]')) {
    const app = apps.find(item => item.id === card.dataset.app);
    const match = !!app && (category === 'all' || app.category === category) && `${app.name} ${app.category} ${app.description}`.toLocaleLowerCase().includes(query);
    card.hidden = !match; count += match ? 1 : 0;
  }
  document.querySelector('#empty-state').hidden = count > 0;
  document.querySelector('#app-count').textContent = query || category !== 'all' ? `${count} app${count === 1 ? '' : 's'} found` : `${count} app${count === 1 ? '' : 's'} · and growing`;
}
function resetSearch() { search.value = ''; category = 'all'; updateFilters(); filter(); search.focus(); }
function updateFilters() {
  for (const button of document.querySelectorAll('[data-category]')) {
    const active = button.dataset.category === category;
    button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
  }
}
search.addEventListener('input', filter);
document.querySelector('#reset-search').addEventListener('click', resetSearch);
for (const button of document.querySelectorAll('[data-category]')) button.addEventListener('click', () => { category = button.dataset.category; updateFilters(); filter(); });
window.addEventListener('hashchange', route);
function field(view, name) { return view.querySelector(`[data-release="${name}"]`); }
for (const view of details) {
  const download = field(view, 'download-button');
  download.addEventListener('click', event => {
    if (download.getAttribute('aria-disabled') === 'true') {
      event.preventDefault(); field(view, 'release-title').closest('section').scrollIntoView();
      if (navigator.onLine) loadCatalog();
    }
  });
  field(view, 'copy-checksum').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(field(view, 'checksum').textContent); field(view, 'copy-status').textContent = 'Copied'; }
    catch { field(view, 'copy-status').textContent = 'Select and copy the checksum above.'; }
  });
}
function applyRelease(app) {
  const view = details.find(view => view.dataset.detail === app.id);
  const release = app.release;
  if (!view || !release) return;
  const prefix = 'https://github.com/mail-brandonai/app-gallery/releases/';
  if (!release.downloadUrl?.startsWith(prefix) || !release.url?.startsWith(prefix) || !release.downloadUrl.endsWith(`/${app.id}.apk`) || !(release.size > 0)) return;
  const download = field(view, 'download-button');
  download.href = release.downloadUrl;
  download.removeAttribute('aria-disabled');
  download.textContent = 'Download APK ↓';
  const size = `${(release.size / 1024 / 1024).toFixed(1)} MB`;
  field(view, 'download-meta').textContent = `v${release.version} · ${size} · Android ${app.minimumAndroid}+`;
  field(view, 'release-fact').replaceChildren(document.createTextNode('Version '), Object.assign(document.createElement('strong'), { textContent: release.version }));
  field(view, 'release-title').textContent = `${app.name} ${release.version}`;
  field(view, 'release-description').textContent = `Signed APK · ${size}. Download the APK using the button above. Install future compatible updates over your existing release installation to retain saved data.`;
  if (/^[a-f0-9]{64}$/i.test(release.checksum || '')) {
    field(view, 'checksum-block').hidden = false;
    field(view, 'checksum').textContent = release.checksum;
  }
}
route(); filter();
let catalogRequest = 0;
function disableDownloads(message) {
  for (const view of details) {
    const download = field(view, 'download-button');
    download.setAttribute('aria-disabled', 'true');
    download.href = view.dataset.detail === 'daylight' ? '#release-info' : '#ascent-release-info';
    download.textContent = navigator.onLine ? 'Check connection' : 'Connect to download';
    field(view, 'download-meta').textContent = message;
    field(view, 'checksum-block').hidden = true;
    field(view, 'release-description').textContent = 'Connect to check the latest release and download the APK. You can still explore this app offline.';
    field(view, 'release-fact').textContent = 'Availability — connect to check';
  }
}
async function loadCatalog() {
  const requestId = ++catalogRequest;
  const status = document.querySelector('#catalog-status');
  disableDownloads('Checking current releases…');
  if (!navigator.onLine) {
    status.textContent = 'Offline — connect to check releases and download apps.';
    disableDownloads('Connect to check current releases.');
    return;
  }
  try {
    const response = await fetch('data/apps.json', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Catalog unavailable');
    const catalog = await response.json();
    if (!Array.isArray(catalog.apps)) throw new Error('Invalid catalog');
    if (requestId !== catalogRequest || !navigator.onLine) return;
    apps = catalog.apps;
    for (const view of details) {
      field(view, 'download-button').textContent = 'APK coming soon';
      field(view, 'download-meta').textContent = 'First signed release in preparation';
      field(view, 'release-description').textContent = 'The first signed APK is in preparation. A download will appear when a verified release is available.';
      field(view, 'release-fact').textContent = 'Availability — preview';
    }
    status.textContent = '';
    filter(); apps.forEach(applyRelease);
  } catch {
    if (requestId !== catalogRequest) return;
    status.textContent = 'Release information is unavailable. Check your connection and try again.';
    disableDownloads('Connect to check current releases.');
  }
}
window.addEventListener('offline', () => {
  ++catalogRequest;
  disableDownloads('Connect to check current releases.');
  document.querySelector('#catalog-status').textContent = 'Offline — connect to check releases and download apps.';
});
window.addEventListener('online', loadCatalog);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') loadCatalog(); });
await loadCatalog();
