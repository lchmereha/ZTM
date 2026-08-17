import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Checks whether the running app is still up-to-date with the deployed version.
 *
 * How it works:
 * 1. At build time, `vite-plugin-build-hash` bakes a unique hash into the bundle
 *    (via `import.meta.env.VITE_BUILD_HASH`) and writes the same hash to `version.json`.
 * 2. On every route change, this hook fetches `/version.json` (with `cache: 'no-store'`
 *    to bypass browser cache) and compares its `buildHash` with the one embedded in the bundle.
 * 3. If they differ → a new deploy happened while the user had the tab open → silent reload.
 *
 * Safety guards:
 * - Only runs in production (`import.meta.env.PROD`).
 * - Only reloads once per session to avoid infinite reload loops.
 * - Silently ignores network errors (offline, CORS, etc.).
 * - Skips the initial mount to avoid unnecessary fetch on first load.
 */
export default function useBuildVersionCheck() {
  const location = useLocation();
  const hasReloaded = useRef(false);
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip in development — version.json only exists in production builds
    if (!import.meta.env.PROD) return;

    // Skip the initial render — the bundle is guaranteed fresh on first load
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // Prevent infinite reload loops
    if (hasReloaded.current) return;

    const currentHash = import.meta.env.VITE_BUILD_HASH;

    // If the plugin wasn't active (e.g., dev mode), skip silently
    if (!currentHash) return;

    const controller = new AbortController();

    fetch(`${import.meta.env.BASE_URL}version.json`, {
      cache: 'no-store',
      signal: controller.signal
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: { buildHash?: string } | null) => {
        if (data?.buildHash && data.buildHash !== currentHash) {
          hasReloaded.current = true;
          window.location.reload();
        }
      })
      .catch(() => {
        // Silently ignore fetch errors (offline, CORS, 404, etc.)
      });

    return () => controller.abort();
  }, [location.pathname]);
}
