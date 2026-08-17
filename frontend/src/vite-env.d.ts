/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Variante de marca resolvida em tempo de build. Ver src/config/tenants. */
  readonly VITE_TENANT?: string;
  /** Hash do build injetado pelo vite-plugin-build-hash. Só em produção. */
  readonly VITE_BUILD_HASH?: string;
}
