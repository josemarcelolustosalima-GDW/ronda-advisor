import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

const APP_BUILD_VERSION = '2026.10.08.v2';

// Force purge of outdated Service Worker caches when a new build version is detected
async function enforceLatestBuildVersion() {
  try {
    const savedVersion = localStorage.getItem('guideway_app_build_version');
    if (savedVersion !== APP_BUILD_VERSION) {
      localStorage.setItem('guideway_app_build_version', APP_BUILD_VERSION);

      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.update()));
      }

      // If upgrading from a previous version, reload once from network
      if (savedVersion !== null) {
        window.location.reload();
        return;
      }
    }
  } catch {
    // Ignore storage/cache errors in restricted browsing modes
  }
}

enforceLatestBuildVersion();

// Register Service Worker with immediate auto-reload on new deployment
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      registration.update();
    }
  },
});

createRoot(document.getElementById('root')!).render(<App />);
