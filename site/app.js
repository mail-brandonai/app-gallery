const home = document.querySelector('#home-view');
const detail = document.querySelector('#detail-view');
const search = document.querySelector('#search');
let category = 'all';
let apps = [{ id: 'daylight', name: 'Daylight', category: 'Weather', description: 'Weather with a companion', release: null }];
let previousRoute = null;
function route() {
  const hash = location.hash;
  const details = hash === '#app/daylight' || hash === '#daylight-features' || hash === '#release-info';
  home.hidden = details;
  detail.hidden = !details;
  document.title = details ? 'Daylight — App Gallery' : 'App Gallery — Liquid Synthetics';
  if (hash === '#app/daylight' && previousRoute !== hash) { window.scrollTo({ top: 0, behavior: 'instant' }); }
  else if (hash && hash !== '#') { requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView()); }
  else window.scrollTo({ top: 0, behavior: 'instant' });
  if (previousRoute !== null && (details !== previousRoute.startsWith('#app/') && hash === '#app/daylight')) {
    const heading = detail.querySelector('h1'); heading.tabIndex = -1; heading.focus({ preventScroll: true });
  }
  previousRoute = hash;
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
const download = document.querySelector('#download-button');
download.addEventListener('click', event => { if (download.getAttribute('aria-disabled') === 'true') { event.preventDefault(); document.querySelector('#release-info').scrollIntoView(); } });
function applyRelease(app) {
  const release = app?.release;
  if (!release) return;
  const prefix = 'https://github.com/mail-brandonai/app-gallery/releases/';
  if (!release.downloadUrl?.startsWith(prefix) || !release.url?.startsWith(prefix) || !release.downloadUrl.endsWith('.apk')) return;
  download.href = release.downloadUrl;
  download.removeAttribute('aria-disabled');
  download.textContent = 'Download APK ↓';
  const size = `${(release.size / 1024 / 1024).toFixed(1)} MB`;
  document.querySelector('#download-meta').textContent = `v${release.version} · ${size} · Android ${app.minimumAndroid}+`;
  document.querySelector('#release-fact').replaceChildren(document.createTextNode('Version '), Object.assign(document.createElement('strong'), { textContent: release.version }));
  document.querySelector('#release-title').textContent = `Daylight ${release.version}`;
  document.querySelector('#release-description').textContent = `Signed APK · ${size}. Download the APK using the button above. Install future updates over your existing installation to retain progress.`;
  if (/^[a-f0-9]{64}$/i.test(release.checksum || '')) {
    document.querySelector('#checksum-block').hidden = false;
    document.querySelector('#checksum').textContent = release.checksum;
  }
}
document.querySelector('#copy-checksum').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(document.querySelector('#checksum').textContent); document.querySelector('#copy-status').textContent = 'Copied'; }
  catch { document.querySelector('#copy-status').textContent = 'Select and copy the checksum above.'; }
});
route();
try {
  const response = await fetch('data/apps.json');
  if (!response.ok) throw new Error('Catalog unavailable');
  const catalog = await response.json();
  if (!Array.isArray(catalog.apps)) throw new Error('Invalid catalog');
  apps = catalog.apps;
  filter(); applyRelease(apps.find(app => app.id === 'daylight'));
} catch {
  document.querySelector('#catalog-status').textContent = 'Release information is unavailable. Please refresh the page or try again later.';
}
