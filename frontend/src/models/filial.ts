import type { Empresa } from './empresa';
import type { ModeloEtiqueta } from './modelo-etiqueta';

export interface Filial {
  id: number;
  idEmpresa: number;
  nome: string;
  endereco?: string | null;
  documentoIdentificacao?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  numeroLogradouro?: string | null;
  telefone?: string | null;
  idEtiquetaPadrao?: number | null;
  empresa?: Empresa;
  etiquetaPadrao?: ModeloEtiqueta | null;
}
