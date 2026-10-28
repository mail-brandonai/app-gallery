const installButton = document.querySelector('#install-gallery');
const installStatus = document.querySelector('#gallery-install-status');
const offlineReady = document.querySelector('#offline-ready');
const updateNotice = document.querySelector('#gallery-update');
const updateButton = document.querySelector('#update-gallery');
const offlineNotice = document.querySelector('#offline-notice');
const standalone = window.matchMedia('(display-mode: standalone)');
let installPrompt = null;
function installed() { return standalone.matches || navigator.standalone === true; }
function reflectInstall() {
  for (const element of document.querySelectorAll('[data-browser-install]')) element.hidden = installed();
  installButton.hidden = installed() || !installPrompt;
}
reflectInstall();
standalone.addEventListener?.('change', reflectInstall);
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event; reflectInstall();
});
window.addEventListener('appinstalled', () => {
  installPrompt = null; installButton.hidden = true;
  installStatus.textContent = 'App Gallery is installed.';
  for (const element of document.querySelectorAll('[data-browser-install]')) element.hidden = true;
});
installButton.addEventListener('click', async () => {
  const prompt = installPrompt;
  if (!prompt) return;
  installPrompt = null; installButton.hidden = true;
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    installStatus.textContent = choice.outcome === 'accepted' ? 'Installation requested. Follow your browser’s instructions.' : 'No problem. You can install later from your browser’s menu.';
  } catch {
    installStatus.textContent = 'Use your browser’s menu to install App Gallery.';
  }
});
function reflectNetwork() { offlineNotice.hidden = navigator.onLine; }
window.addEventListener('online', reflectNetwork);
window.addEventListener('offline', reflectNetwork);
reflectNetwork();
if ('serviceWorker' in navigator && window.isSecureContext) {
  let reloading = false;
  const controlledAtLoad = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controlledAtLoad && !reloading) { reloading = true; window.location.reload(); }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(registration => {
    function showUpdate() { if (registration.waiting && navigator.serviceWorker.controller) updateNotice.hidden = false; }
    showUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed') showUpdate(); });
    });
    updateButton.addEventListener('click', () => {
      if (registration.waiting) {
        updateButton.disabled = true;
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
    navigator.serviceWorker.ready.then(() => { offlineReady.textContent = 'Ready to browse offline. Connect to check releases and download apps.'; });
    function checkUpdate() { if (navigator.onLine) registration.update().catch(() => {}); }
    window.addEventListener('online', checkUpdate);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(); });
  }).catch(() => { offlineReady.textContent = 'Offline browsing isn’t available right now. The Gallery still works online.'; });
} else {
  offlineReady.textContent = 'Offline browsing isn’t available in this browser. The Gallery still works online.';
}
