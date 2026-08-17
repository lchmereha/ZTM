// ── Helpers shared across Impressão steps ───────────────────

/**
 * Normalize column names: remove accents, spaces, and uppercase.
 */
export const normalizeColumnName = (col: string): string => {
  return col
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase()
    .trim();
};

/**
 * Column name mapping from spreadsheet headers to ImportItem fields.
 */
export const COLUMN_MAP: Record<string, string> = {
  CODIGO: 'codigo',
  PRODUTO: 'nome',
  NOME: 'nome',
  UNIDADE: 'unidadeMedida',
  UNIDADEMEDIDA: 'unidadeMedida',
  CATEGORIA: 'categoria',
  QUANTIDADE: 'quantidade',
  CODIGOUNICO: 'codigoUnico',
  VALIDADE: 'dataValidade',
  DATAVALIDADE: 'dataValidade',
  LOTE: 'lote',
  FABRICACAO: 'dataFabricacao',
  DATAFABRICACAO: 'dataFabricacao'
};

/**
 * Resolves a normalized column name to an ImportItem field.
 * Falls back to COLUMN_MAP for exact matches, then checks if the
 * normalized name contains "VOLUME" — which maps to qtdeUMVolume.
 */
export function resolveColumnMapping(normalized: string): string | undefined {
  if (COLUMN_MAP[normalized]) return COLUMN_MAP[normalized];
  if (normalized.includes('VOLUME')) return 'qtdeUMVolume';
  if (normalized.includes('ESTOQUE')) return 'posicaoEstoque';
  return undefined;
}

/**
 * Converte valores de data da planilha (serial Excel ou string) para formato YYYY-MM-DD
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
export function formatDateValue(value: any): string {
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }
  return String(value || '');
}

/**
 * Parse a CSV line handling quoted fields
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === ';') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}
