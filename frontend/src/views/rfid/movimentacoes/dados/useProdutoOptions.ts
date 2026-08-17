import { useEffect, useState } from 'react';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { produtoEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

// ── Types ───────────────────────────────────────────────────

export interface ProdutoOption {
  id: number;
  codigo: string;
  nome: string;
  unidadeMedida: string;
  categoria?: { nome: string } | null;
}

// ── Hook ────────────────────────────────────────────────────

/**
 * Loads the full product list on mount.
 * Shared between AssociacaoItemForm and ConferenciaItemForm.
 */
export function useProdutoOptions() {
  const handleError = useErrorHandler();
  const [produtos, setProdutos] = useState<ProdutoOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(produtoEndpoint);
        setProdutos(Array.isArray(data) ? data : []);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [handleError]);

  return { produtos, loading };
}
