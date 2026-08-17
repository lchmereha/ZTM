import defaultTenant from './default';
import marluvasTenant from './marluvas';
import type { TenantConfig } from './types';

export type { TenantConfig } from './types';

const tenants: Record<string, TenantConfig> = {
  [defaultTenant.id]: defaultTenant,
  [marluvasTenant.id]: marluvasTenant
};

function resolveTenant(): TenantConfig {
  const id = import.meta.env.VITE_TENANT?.trim();
  if (!id) return defaultTenant;

  const found = tenants[id];
  if (!found) {
    // Falha alto: um VITE_TENANT com erro de digitação geraria um build com a
    // marca errada, e isso passaria despercebido até chegar no cliente.
    throw new Error(`VITE_TENANT="${id}" não existe. Variantes disponíveis: ${Object.keys(tenants).join(', ')}.`);
  }
  return found;
}

/** Variante ativa, resolvida em tempo de build por `VITE_TENANT`. */
export const tenant = resolveTenant();
