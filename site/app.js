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
try {
  const response = await fetch('data/apps.json');
  if (!response.ok) throw new Error('Catalog unavailable');
  const catalog = await response.json();
  if (!Array.isArray(catalog.apps)) throw new Error('Invalid catalog');
  apps = catalog.apps;
  filter(); apps.forEach(applyRelease); route();
} catch {
  document.querySelector('#catalog-status').textContent = 'Release information is unavailable. Please refresh the page or try again later.';
}
