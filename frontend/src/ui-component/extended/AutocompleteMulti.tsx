import Autocomplete, { type AutocompleteProps } from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

// ── Estilos ─────────────────────────────────────────────────────
const singleLineSx = {
  '& .MuiAutocomplete-inputRoot': {
    flexWrap: 'nowrap',
    overflow: 'hidden'
  }
};

// ── Constantes de medição ───────────────────────────────────────
const COUNT_CHIP_WIDTH = 48; // largura estimada do chip "+N"
const TAG_GAP = 6; // gap entre chips

// ── Props ───────────────────────────────────────────────────────

/**
 * Props estendidas para o AutocompleteMulti. Herda todas as props do
 * MUI Autocomplete (multiple=true) e adiciona:
 * - `label` — label do TextField interno
 * - `selectAll` — exibir checkbox "Marcar/Desmarcar Todos" (default: true)
 * - `textFieldProps` — props adicionais para o TextField interno
 */
type AutocompleteMultiProps<T> = Omit<
  AutocompleteProps<T, true, boolean, false>,
  'multiple' | 'disableClearable' | 'renderInput' | 'renderValue' | 'sx'
> & {
  /** Label do campo (renderizado no TextField interno) */
  label: string;
  /** Exibir checkbox "Marcar/Desmarcar Todos" no endAdornment (default: true) */
  selectAll?: boolean;
  /** Props adicionais repassadas ao TextField interno */
  textFieldProps?: Partial<Omit<TextFieldProps, 'label'>>;
  /** sx do Autocomplete — mesclado com os estilos internos de single-line */
  sx?: AutocompleteProps<T, true, boolean, false>['sx'];
};

/**
 * Autocomplete multi-select com:
 * - Limitação dinâmica de chips baseada no espaço disponível (single-line)
 * - Chip "+N" para itens excedentes
 * - Checkbox "Marcar/Desmarcar Todos" (opcional, ativo por padrão)
 * - Quando selectAll=false, exibe botão de limpar (clear)
 *
 * Todas as props do MUI Autocomplete são suportadas via spread.
 */
function AutocompleteMulti<T>({
  label,
  selectAll = true,
  textFieldProps,
  options,
  value,
  onChange,
  getOptionLabel,
  getOptionKey,
  sx: sxProp,
  ...rest
}: AutocompleteMultiProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxTags, setMaxTags] = useState(1);

  // ── Medição de overflow ─────────────────────────────────────
  // Mede a largura real do endAdornment (botões clear/dropdown/checkbox)
  // via DOM para reservar o espaço correto para os chips.
  const recalculate = useCallback(() => {
    const wrapper = containerRef.current;
    if (!wrapper) return;

    const inputRoot = wrapper.querySelector<HTMLElement>('.MuiAutocomplete-inputRoot');
    if (!inputRoot) return;

    const rootRect = inputRoot.getBoundingClientRect();
    const style = getComputedStyle(inputRoot);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;

    // Medir a largura real do endAdornment (inclui dropdown, clear, checkbox)
    const endAdornment = inputRoot.querySelector<HTMLElement>('.MuiAutocomplete-endAdornment');
    const endAdornmentWidth = endAdornment ? endAdornment.offsetWidth : 0;

    // Espaço extra para o checkbox posicionado com absolute (fica fora do endAdornment)
    const checkboxExtra = selectAll ? 32 : 0;

    const availableWidth = rootRect.width - paddingLeft - paddingRight - endAdornmentWidth - checkboxExtra;

    const tags = inputRoot.querySelectorAll<HTMLElement>('.MuiAutocomplete-tag');
    if (tags.length === 0) {
      setMaxTags(1);
      return;
    }

    let usedWidth = 0;
    let fitCount = 0;

    for (const tag of tags) {
      const tagWidth = tag.offsetWidth + TAG_GAP;
      const needsCountChip = fitCount < tags.length - 1;
      const wouldExceed = usedWidth + tagWidth + (needsCountChip ? COUNT_CHIP_WIDTH : 0) > availableWidth;

      if (wouldExceed && fitCount > 0) break;
      usedWidth += tagWidth;
      fitCount++;
    }

    setMaxTags(Math.max(1, fitCount));
  }, [selectAll]);

  // Recalcular após cada mudança de valor (antes do paint)
  useLayoutEffect(() => {
    recalculate();
  }, [value, recalculate]);

  // Recalcular no resize do container
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => recalculate());
    observer.observe(el);
    return () => observer.disconnect();
  }, [recalculate]);

  // ── Lógica de "Selecionar Todos" ───────────────────────────
  const allSelected = Array.isArray(value) && value.length === options.length && options.length > 0;
  const someSelected = !allSelected && Array.isArray(value) && value.length > 0;

  const handleToggleAll = () => {
    if (!onChange) return;
    const syntheticEvent = {} as React.SyntheticEvent;
    onChange(syntheticEvent, allSelected ? ([] as T[]) : ([...options] as T[]), allSelected ? 'removeOption' : 'selectOption');
  };

  // ── Merge sx ───────────────────────────────────────────────
  const mergedSx = Array.isArray(sxProp) ? [singleLineSx, ...sxProp] : sxProp ? [singleLineSx, sxProp] : singleLineSx;

  return (
    <div ref={containerRef}>
      <Autocomplete
        multiple
        disableClearable={selectAll}
        disableCloseOnSelect
        size="small"
        options={options}
        value={value}
        onChange={onChange}
        getOptionLabel={getOptionLabel}
        getOptionKey={getOptionKey}
        renderInput={(params) => (
          <TextField
            {...params}
            {...textFieldProps}
            label={label}
            slotProps={{
              ...params.slotProps,
              ...textFieldProps?.slotProps,
              input: {
                ...params.slotProps.input,
                ...(typeof textFieldProps?.slotProps?.input === 'object' ? textFieldProps.slotProps.input : {}),
                endAdornment: (
                  <>
                    {selectAll && (
                      <Checkbox
                        size="small"
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={handleToggleAll}
                        sx={{ p: 0, position: 'absolute', right: 36, zIndex: 1 }}
                        title="Marcar/Desmarcar Todos"
                      />
                    )}
                    {params.slotProps.input.endAdornment}
                  </>
                )
              }
            }}
          />
        )}
        renderValue={(selected, getItemProps) => {
          const labelFn = getOptionLabel ?? String;
          const keyFn = getOptionKey ?? ((_opt: T, idx: number) => idx);
          return (
            <>
              {selected.slice(0, maxTags).map((option, index) => (
                <Chip {...getItemProps({ index })} key={keyFn(option, index) as React.Key} label={labelFn(option)} size="small" />
              ))}
              {selected.length > maxTags && (
                <Chip className="MuiAutocomplete-tag MuiAutocomplete-tagSizeSmall" label={`+${selected.length - maxTags}`} size="small" />
              )}
            </>
          );
        }}
        sx={mergedSx}
        {...rest}
      />
    </div>
  );
}

export default AutocompleteMulti;
