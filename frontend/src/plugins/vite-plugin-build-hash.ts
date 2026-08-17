import type { Plugin } from 'vite';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Vite plugin that generates a `version.json` file in the build output directory.
 *
 * On every production build, a unique build hash (Unix timestamp) is embedded into
 * the bundle via `import.meta.env.VITE_BUILD_HASH` and written to `dist/version.json`.
 *
 * At runtime, the app periodically fetches `version.json` (with `cache: 'no-store'`)
 * and compares it against the hash that was baked into the bundle. If they differ,
 * it means a new deploy happened and the page reloads automatically.
 *
 * @see {@link ../hooks/useBuildVersionCheck.ts} for the client-side check.
 */
export default function buildHashPlugin(): Plugin {
  const buildHash = Date.now().toString(36);

  return {
    name: 'vite-plugin-build-hash',
    apply: 'build',

    config() {
      return {
        define: {
          // Injects the build hash as a compile-time constant accessible via import.meta.env
          'import.meta.env.VITE_BUILD_HASH': JSON.stringify(buildHash)
        }
      };
    },

    writeBundle(options) {
      const outDir = options.dir ?? resolve(process.cwd(), 'dist');
      const versionData = {
        buildHash,
        builtAt: new Date().toISOString()
      };

      writeFileSync(resolve(outDir, 'version.json'), JSON.stringify(versionData), 'utf-8');
    }
  };
}
