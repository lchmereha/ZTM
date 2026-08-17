/**
 * Normaliza uma string para caixa alta sem acentuação.
 * Utilizado para padronizar dados textuais no banco.
 */
export function normalizeString(value: string): string {
  return value
    .normalize('NFD') // Decompõe caracteres acentuados (é → e + ´)
    .replace(/[\u0300-\u036f]/g, '') // Remove os diacríticos
    .toUpperCase();
}

/**
 * Campos de texto que NÃO devem ser normalizados.
 * Motivos:
 *   - senha: hash bcrypt, case-sensitive
 *   - codigoZPL: código de impressora ZPL, case-sensitive
 *   - logo: dados base64 de imagem
 *   - ipConexao: endereço IP (não se aplica uppercase)
 *   - email: convenção lowercase (mas poderia ser uppercased)
 *   - unidadeMedida: unidades técnicas case-sensitive (Hz, dB, mA, etc.)
 */
export const CASE_SENSITIVE_FIELDS = new Set([
  'senha',
  'codigoZPL',
  'logo',
  'ipConexao',
  'email',
  'unidadeMedida',
]);

/**
 * Chaves cujos valores (arrays/objetos) NÃO devem ser recursados.
 * Contêm metadados técnicos do DataTables (nomes de colunas,
 * direção de ordenação, etc.) que precisam permanecer intactos.
 */
const SKIP_RECURSION_FIELDS = new Set([
  'columns',
  'order',
  'search',
  'filters',
]);

/**
 * Percorre recursivamente um objeto e aplica normalizeString
 * a todos os campos string que não estejam na lista de exceções.
 * Pula recursão em campos marcados em SKIP_RECURSION_FIELDS.
 */
export function normalizePayload<T extends Record<string, any>>(data: T): T {
  if (!data || typeof data !== 'object') return data;

  const normalized = { ...data };

  for (const key of Object.keys(normalized)) {
    const value = normalized[key];

    // Pular campos que não devem ser recursados (metadados técnicos)
    if (SKIP_RECURSION_FIELDS.has(key)) continue;

    if (typeof value === 'string' && !CASE_SENSITIVE_FIELDS.has(key)) {
      (normalized as any)[key] = normalizeString(value);
    } else if (Array.isArray(value)) {
      (normalized as any)[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? normalizePayload(item)
          : item,
      );
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !(value instanceof Date)
    ) {
      (normalized as any)[key] = normalizePayload(value);
    }
  }

  return normalized;
}
