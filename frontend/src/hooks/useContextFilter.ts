import { useMemo } from 'react';
import { useAuth } from 'contexts/AuthContext';
import type { DTFilter } from 'ui-component/datatable';

type FilterScope = 'empresa' | 'filial' | 'none';

/**
 * Returns a DTFilter for the active filial context, used to scope
 * DataTable queries to the selected empresa or filial.
 *
 * - `'empresa'` → filters by `idEmpresa` of the active filial's parent empresa
 * - `'filial'`  → filters by `idFilial` of the active filial
 * - `'none'`    → returns null (no filtering — for agnostic views)
 */
export function useContextFilter(scope: FilterScope): DTFilter | null {
  const { activeFilial } = useAuth();

  return useMemo(() => {
    if (scope === 'none' || !activeFilial) return null;

    if (scope === 'empresa') {
      return { field: 'idEmpresa', type: 'equals', value: activeFilial.idEmpresa };
    }

    // scope === 'filial'
    return { field: 'idFilial', type: 'equals', value: activeFilial.idFilial };
  }, [scope, activeFilial]);
}
