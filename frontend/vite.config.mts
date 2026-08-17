import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import buildHashPlugin from './src/plugins/vite-plugin-build-hash';

/**
 * Variantes de marca disponíveis, lidas de src/config/tenants.
 *
 * A validação precisa acontecer aqui e não no resolver do app: lá ela roda no
 * browser, então um VITE_TENANT com typo geraria um build "bem-sucedido" que
 * quebra com tela branca no cliente. Aqui o build falha.
 */
function assertValidTenant(tenantId: string | undefined) {
  if (!tenantId) return;

  // process.cwd() e não __dirname: este arquivo é ESM (.mts) e __dirname não
  // existe nesse contexto. O Vite sempre roda a partir da raiz do projeto.
  const dir = resolve(process.cwd(), 'src/config/tenants');
  const available = readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && !['index.ts', 'types.ts'].includes(f))
    .map((f) => f.replace(/\.ts$/, ''));

  if (!available.includes(tenantId)) {
    throw new Error(`VITE_TENANT="${tenantId}" não existe. Variantes disponíveis: ${available.join(', ')}.`);
  }
}

export default defineConfig(({ mode }) => {
  // depending on your application, base can also be "/"
  const env = loadEnv(mode, process.cwd(), '');
  const API_URL = `${env.VITE_APP_BASE_NAME}`;
  const PORT = 5173;

  assertValidTenant(env.VITE_TENANT?.trim() || undefined);

  return {
    server: {
      // this ensures that the browser opens upon server start
      open: true,
      // this sets a default port to 3000
      port: PORT,
      host: true
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('@mui/material') || id.includes('@mui/icons-material')) return 'vendor-mui';
            if (id.includes('apexcharts') || id.includes('react-apexcharts')) return 'vendor-charts';
            if (id.includes('datatables.net')) return 'vendor-datatable';
            if (id.includes('exceljs')) return 'vendor-exceljs';
          }
        }
      }
    },
    preview: {
      open: true,
      host: true
    },
    define: {
      global: 'window'
    },
    resolve: {
      alias: {
        // { find: '', replacement: path.resolve(__dirname, 'src') },
        // {
        //   find: /^~(.+)/,
        //   replacement: path.join(process.cwd(), 'node_modules/$1')
        // },
        // {
        //   find: /^src(.+)/,
        //   replacement: path.join(process.cwd(), 'src/$1')
        // }
        // {
        //   find: 'assets',
        //   replacement: path.join(process.cwd(), 'src/assets')
        // },
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs'
      },
      tsconfigPaths: true
    },
    base: API_URL,
    plugins: [react(), buildHashPlugin()]
  };
});
