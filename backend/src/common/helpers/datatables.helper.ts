import { DatatablesRequestDto } from '../dto/datatables.dto';
import { PrismaClient } from '../../generated/prisma/client';

/**
 * Utilitário para extrair o orderBy do payload padrão do DataTables.net (serverSide).
 *
 * O DataTables envia:
 *   order: [{ column: 0, dir: 'asc' }]
 *   columns: [{ data: 'nome', orderable: true }, ...]
 *
 * Este helper converte para o formato do Prisma:
 *   orderBy: { nome: 'asc' }
 *
 * Suporta colunas aninhadas (ex: "empresa.nome" → { empresa: { nome: 'asc' } })
 */
export function parseDatatablesOrder(
  data: DatatablesRequestDto,
): Record<string, any> | undefined {
  const { order, columns } = data;

  if (!order || !Array.isArray(order) || order.length === 0) return undefined;
  if (!columns || !Array.isArray(columns)) return undefined;

  const firstOrder = order[0];
  const colIndex = Number(firstOrder.column);
  const dir: 'asc' | 'desc' = firstOrder.dir === 'desc' ? 'desc' : 'asc';

  const column = columns[colIndex];
  if (!column || !column.data || column.orderable === false) return undefined;

  const field = column.data;

  // Suportar campos aninhados: "empresa.nome" → { empresa: { nome: 'asc' } }
  const parts = field.split('.');
  if (parts.length === 1) {
    return { [field]: dir };
  }

  // Construir objeto aninhado de trás para frente
  let result: any = dir;
  for (let i = parts.length - 1; i >= 0; i--) {
    result = { [parts[i]]: result };
  }
  return result;
}

/**
 * Fields that must NEVER be included in a DataTables select response.
 * Prevents client-side extraction of sensitive data (e.g. password hashes).
 */
const BLOCKED_SELECT_FIELDS = new Set([
  'senha',
  'password',
  'hash',
  'secret',
  'token',
  'chave',
  'apiKeys',
]);

/**
 * Remove recursivamente os campos sensíveis dos registros devolvidos ao cliente.
 *
 * Bloquear os campos apenas na montagem do `select` não é suficiente: o
 * DataTables manda `columns[].data` e um path de um único segmento que aponte
 * para uma *relação* (ex.: `{"data":"usuario"}` em /movimentacao/datatables)
 * vira `select: { usuario: true }`, e o Prisma devolve o registro relacionado
 * inteiro — inclusive `senha`. Como o generator `prisma-client` do Prisma 7 só
 * expõe o DMMF como tipo, não há como saber em runtime quais paths são
 * relações; por isso a garantia fica aqui, na saída, onde vale para qualquer
 * relação presente ou futura.
 *
 * `options.except` libera campos que fazem parte do contrato daquela tela.
 * Só use quando o `select` do service for fixo no servidor — se ele vier do
 * `parseDatatablesSelect`, o cliente escolhe as colunas e a exceção viraria
 * exatamente o vazamento que esta função existe para impedir.
 */
export function sanitizeDatatablesRecords<T>(
  records: T,
  options: { except?: string[] } = {},
): T {
  const except = new Set((options.except ?? []).map((f) => f.toLowerCase()));
  return stripBlockedFields(records, except);
}

function stripBlockedFields<T>(records: T, except: Set<string>): T {
  if (Array.isArray(records)) {
    return records.map((item) => stripBlockedFields(item, except)) as T;
  }

  if (records === null || typeof records !== 'object') return records;
  if (records instanceof Date) return records;

  const entries = Object.entries(records as Record<string, unknown>)
    .filter(([key]) => {
      const k = key.toLowerCase();
      return except.has(k) || !BLOCKED_SELECT_FIELDS.has(k);
    })
    .map(([key, value]) => [key, stripBlockedFields(value, except)]);

  return Object.fromEntries(entries) as T;
}

/**
 * Constrói um Prisma `select` dinamicamente a partir das colunas enviadas pelo DataTables.
 *
 * Cada coluna possui um campo `data` (ex: 'nome', 'tipo.descricao', 'filial.nome').
 * Este helper converte esses paths em uma árvore de select do Prisma:
 *
 *   columns: [{ data: 'descricao' }, { data: 'tipo.descricao' }, { data: 'filial.nome' }]
 *   →
 *   {
 *     id: true,
 *     descricao: true,
 *     tipo: { select: { descricao: true } },
 *     filial: { select: { nome: true } }
 *   }
 *
 * @param data - Payload completo do DataTables (contém `columns[]`)
 * @param extraFields - Campos adicionais a incluir sempre (ex: ['situacao', 'createdAt'])
 */
export function parseDatatablesSelect(
  data: DatatablesRequestDto,
  extraFields: string[] = [],
): Record<string, any> | undefined {
  const { columns } = data;
  if (!columns || !Array.isArray(columns)) return undefined;

  const select: Record<string, any> = { id: true };

  const addPath = (path: string) => {
    const parts = path.split('.');

    // Block sensitive fields at any depth
    if (parts.some((p) => BLOCKED_SELECT_FIELDS.has(p.toLowerCase()))) return;

    if (parts.length === 1) {
      select[parts[0]] = true;
      return;
    }

    // Relation: tipo.descricao → { tipo: { select: { descricao: true } } }
    const relation = parts[0];
    const field = parts.slice(1).join('.');

    if (!select[relation] || select[relation] === true) {
      select[relation] = { select: {} };
    }
    // Suportar múltiplos campos da mesma relação
    select[relation].select[field] = true;
  };

  for (const col of columns) {
    const path = col.data;
    if (typeof path === 'string' && path.trim()) {
      addPath(path);
    }
  }

  for (const extra of extraFields) {
    addPath(extra);
  }

  return select;
}

/**
 * Constrói a cláusula `OR` do Prisma dinamicamente a partir do searchTerm e columns,
 * aplicando busca parcial para textos e, opcionalmente, busca parcial em números via query crua.
 */
export async function buildDatatablesSearch(
  data: DatatablesRequestDto,
  prisma: PrismaClient,
  tableName: string,
  stringFields: string[] = [],
  numericFields: { field: string; column: string }[] = [],
): Promise<Record<string, any>[] | undefined> {
  const searchTerm = data.search?.value?.trim();
  if (!searchTerm) return undefined;

  const { columns } = data;
  if (!columns || !Array.isArray(columns)) return undefined;

  const orConditions: any[] = [];
  const searchAsNumber = !isNaN(Number(searchTerm));

  for (const col of columns) {
    if (col.searchable === false) continue;

    const path = col.data;
    if (typeof path === 'string' && path.trim()) {
      if (stringFields.includes(path)) {
        const parts = path.split('.');
        if (parts.length === 1) {
          orConditions.push({ [parts[0]]: { contains: searchTerm } });
        } else {
          let condition: any = { contains: searchTerm };
          for (let i = parts.length - 1; i >= 0; i--) {
            condition = { [parts[i]]: condition };
          }
          orConditions.push(condition);
        }
      } else if (searchAsNumber) {
        const numField = numericFields.find((f) => f.field === path);
        if (numField) {
          try {
            const rows = await prisma.$queryRawUnsafe<{ id: number }[]>(
              `SELECT id FROM ${tableName} WHERE CAST(${numField.column} AS CHAR) LIKE ? LIMIT 100`,
              `%${searchTerm}%`,
            );
            if (rows.length > 0) {
              const ids = rows.map((r) => r.id);
              orConditions.push({ id: { in: ids } });
            } else {
              // Add an impossible condition so this field explicitly returns 0 matches for this specific search
              orConditions.push({ id: -1 });
            }
          } catch (err) {
            // Ignore db errors (e.g. table not found in raw query) and fallback
            console.error('Error executing partial numeric search:', err);
          }
        }
      }
    }
  }

  return orConditions.length > 0 ? orConditions : undefined;
}
