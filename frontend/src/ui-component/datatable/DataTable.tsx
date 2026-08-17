import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import Box from '@mui/material/Box';
import DT, { type ConfigColumns } from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'datatables.net-responsive-dt';
import 'datatables.net-responsive-dt/css/responsive.dataTables.css';
import 'datatables.net-select-dt';
import './datatable-responsive.css';

export interface DTFilter {
  field: string;
  type: number | string;
  value: string | number | boolean | string[] | number[];
}

/** Response shape expected by DataTables.net server-side processing */
export interface DTResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: Record<string, unknown>[];
}

export interface DataTableProps<T> {
  onFetchData: (data: Record<string, unknown>, filters?: DTFilter[]) => Promise<DTResponse>;
  columns: ConfigColumns[];
  filters?: DTFilter[];
  contextFilter?: DTFilter | null;
  search?: string;
  rowActions?: (item: T) => React.ReactNode;
  renderRowDetails?: (item: T) => React.ReactNode;
  actionColumnWidth?: string | null;
  onError?: (error: unknown) => void;
}

function DataTableFn<T extends object>(
  {
    onFetchData,
    columns,
    filters = [],
    contextFilter = null,
    search = '',
    rowActions,
    renderRowDetails,
    actionColumnWidth,
    onError
  }: DataTableProps<T>,
  ref: React.Ref<{ reload: (resetPaging?: boolean) => void }>
) {
  const tableRef = useRef<HTMLTableElement>(null);
  const dt = useRef<InstanceType<typeof DT> | null>(null);

  // Manter refs estáveis para callbacks — evita recriar a tabela a cada re-render do pai
  const onFetchDataRef = useRef(onFetchData);
  const filtersRef = useRef(filters);
  const contextFilterRef = useRef(contextFilter);
  const onErrorRef = useRef(onError);
  const rowActionsRef = useRef(rowActions);
  const renderRowDetailsRef = useRef(renderRowDetails);
  const columnsRef = useRef(columns);
  const searchRef = useRef(search);

  // Sincronizar refs com os valores atuais
  useEffect(() => {
    onFetchDataRef.current = onFetchData;
  }, [onFetchData]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    rowActionsRef.current = rowActions;
  }, [rowActions]);
  useEffect(() => {
    renderRowDetailsRef.current = renderRowDetails;
  }, [renderRowDetails]);
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  // Serializar filtros para comparação estável (evita reload por nova referência de [])
  const serializedFilters = JSON.stringify(filters);

  /* eslint-disable react-hooks/exhaustive-deps -- Intentional: serializedFilters is a stable proxy for filters to avoid re-runs on reference changes */
  useEffect(() => {
    filtersRef.current = filters;
  }, [serializedFilters]);
  /* eslint-enable react-hooks/exhaustive-deps */
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useImperativeHandle(ref, () => ({
    reload: (resetPaging = false) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataTables signature is (callback: any, resetPaging: boolean)
      dt.current?.ajax.reload(null as any, resetPaging);
    }
  }));

  // A estrutura de colunas determina se a tabela precisa ser recriada
  const hasRowActions = Boolean(rowActions);

  const memoizedColumns = useMemo(() => {
    const processedColumns = columns.map((col, index) => {
      if (col.render && typeof col.render === 'function') {
        const originalRender = col.render;
        return {
          ...col,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataTables.net render callback receives untyped row data
          render: (data: any, type: any, row: any, meta: any) => {
            if (type === 'type' || !row) return data;
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataTables.net ConfigColumns.render has untyped signature
              const result = (originalRender as any)(data, type, row, meta);
              if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
                return `<div class="react-column-render" data-column-index="${index}"></div>`;
              }
              return result;
            } catch (e) {
              // eslint-disable-next-line no-console -- Column render error boundary
              console.error('Render error:', e);
              return data;
            }
          }
        };
      }
      return col;
    });

    const finalCols = [...processedColumns];

    if (renderRowDetails) {
      finalCols.unshift({
        className: 'dt-control',
        orderable: false,
        searchable: false,
        data: null,
        defaultContent: '',
        width: '40px'
      });
    }

    if (!hasRowActions) return finalCols;

    const actionColumn: ConfigColumns = {
      title: 'Ações',
      data: null,
      width: actionColumnWidth === null ? undefined : actionColumnWidth || '1%',
      orderable: false,
      searchable: false,
      className: 'datatable-action-column all',
      responsivePriority: 1,
      render: () =>
        '<div class="datatable-action-container" style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;"></div>'
    };
    return [...finalCols, actionColumn];
  }, [columns, hasRowActions, renderRowDetails, actionColumnWidth]);

  useEffect(() => {
    const tableEl = tableRef.current;
    if (tableEl) {
      dt.current = new DT(tableEl, {
        autoWidth: false,
        columns: memoizedColumns,
        language: { url: 'https://cdn.datatables.net/plug-ins/2.3.3/i18n/pt-BR.json' },
        layout: { bottom2Start: 'pageLength', topStart: 'div', topEnd: null },
        responsive: true,
        search: { search: searchRef.current },
        searching: true,
        serverSide: true,
        ajax: async (data, callback) => {
          try {
            const allFilters = [...(filtersRef.current || [])];
            if (contextFilterRef.current) allFilters.push(contextFilterRef.current);
            const res = await onFetchDataRef.current(data as Record<string, unknown>, allFilters);
            callback(res);
          } catch (err) {
            if (onErrorRef.current) onErrorRef.current(err);
            callback({
              draw: (data as { draw: number }).draw,
              recordsTotal: 0,
              recordsFiltered: 0,
              data: []
            });
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
        rowCallback: (row: Node, rowData: any) => {
          const tr = row as HTMLElement;

          // Processar colunas que renderizam componentes React
          tr.querySelectorAll('.react-column-render').forEach((container) => {
            const colIndex = parseInt((container as HTMLElement).dataset.columnIndex || '0');
            const originalCol = columnsRef.current[colIndex];
            if (originalCol && originalCol.render) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataTables.net ConfigColumns.render has untyped signature
              const element = (originalCol.render as any)(rowData);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Custom DOM property for React root tracking
              let root = (container as any)._reactRoot as Root | undefined;
              if (!root) {
                root = createRoot(container);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Custom DOM property for React root tracking
                (container as any)._reactRoot = root;
              }
              root.render(element);
            }
          });

          if (rowActionsRef.current) {
            const container = tr.querySelector('.datatable-action-container');
            if (container) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Custom DOM property for React root tracking
              let root = (container as any)._reactRoot as Root | undefined;
              if (!root) {
                root = createRoot(container);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Custom DOM property for React root tracking
                (container as any)._reactRoot = root;
              }
              root.render(rowActionsRef.current(rowData as T));
            }
          }
        }
      });

      const clickHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const td = target.closest('td.dt-control');
        if (!td) return;
        const tr = td.closest('tr');
        if (!tr) return;

        const row = dt.current!.row(tr);
        if (row.child.isShown()) {
          const childNodes = row.child();
          const childNode = childNodes ? (childNodes as unknown as HTMLElement[])[0] : undefined;
          if (childNode) {
            const container = childNode.querySelector('.react-row-details-container');
            if (container) {
              const root = (container as unknown as { _reactRoot?: { unmount: () => void } })._reactRoot;
              if (root) root.unmount();
            }
          }
          row.child.hide();
          tr.classList.remove('dt-hasChild');
        } else {
          if (renderRowDetailsRef.current) {
            const rowData = row.data();
            const container = document.createElement('div');
            container.className = 'react-row-details-container';
            const root = createRoot(container);
            (container as unknown as { _reactRoot?: Root })._reactRoot = root;
            root.render(renderRowDetailsRef.current(rowData as T));
            row.child(container).show();
            tr.classList.add('dt-hasChild');
          }
        }
      };
      tableEl.addEventListener('click', clickHandler);

      return () => {
        // Unmount all React roots to prevent memory leaks
        if (tableEl) {
          tableEl.removeEventListener('click', clickHandler);
          tableEl
            .querySelectorAll('.react-column-render, .datatable-action-container, .react-row-details-container')
            .forEach((container) => {
              const root = (container as HTMLElement & { _reactRoot?: Root })._reactRoot;
              if (root) {
                root.unmount();
              }
            });
        }
        dt.current?.destroy();
      };
    }
  }, [memoizedColumns]);

  // Recarregar dados quando os filtros mudarem (sem recriar a tabela)
  // Pula a execução inicial — a tabela já faz o fetch automaticamente ao ser criada
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (dt.current) {
      dt.current.ajax.reload();
    }
  }, [serializedFilters]);

  // Recarregar dados quando o filtro de contexto (empresa/filial) mudar
  const serializedContextFilter = JSON.stringify(contextFilter);
  const isContextFilterInitialMount = useRef(true);
  useEffect(() => {
    contextFilterRef.current = contextFilter ?? null;
    if (isContextFilterInitialMount.current) {
      isContextFilterInitialMount.current = false;
      return;
    }
    if (dt.current) {
      dt.current.ajax.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serializedContextFilter is a stable proxy
  }, [serializedContextFilter]);

  // Busca global — usa o search nativo do DataTables.net (search.value no payload)
  const isSearchInitialMount = useRef(true);
  useEffect(() => {
    if (isSearchInitialMount.current) {
      isSearchInitialMount.current = false;
      return;
    }
    if (dt.current) {
      dt.current.search(search).draw();
    }
  }, [search]);

  // ── Responsive recalc on container resize ────────────────
  // datatables.net-responsive v3.0.8 only listens for 'orientationchange',
  // not 'resize'. We use a ResizeObserver on the container so the responsive
  // plugin recalculates column visibility whenever the available width changes
  // (window resize, sidebar toggle, layout shifts, etc.)
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      if (dt.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- responsive.recalc() is part of the Responsive API but not typed
        (dt.current as any).responsive?.recalc();
      }
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [memoizedColumns]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        overflow: 'hidden',
        '& table.dataTable tbody td.dt-control::before': {
          borderLeftColor: 'currentColor',
          opacity: 0.6
        },
        '& table.dataTable tbody tr.dt-hasChild td.dt-control::before': {
          borderTopColor: 'currentColor',
          borderLeftColor: 'transparent',
          opacity: 0.6
        }
      }}
    >
      <table ref={tableRef} className="display" style={{ width: '100%' }} />
    </Box>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
const DataTable = forwardRef(DataTableFn) as <T extends { [key: string]: any }>(
  props: DataTableProps<T> & { ref?: React.Ref<{ reload: (resetPaging?: boolean) => void }> }
) => React.ReactElement;

export default DataTable;
