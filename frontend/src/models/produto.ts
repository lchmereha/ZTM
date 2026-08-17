import type { Categoria } from './categoria';
import type { ModeloEtiqueta } from './modelo-etiqueta';

export interface Produto {
  id: number;
  idEmpresa: number;
  codigo: string;
  nome: string;
  unidadeMedida: string;
  idCategoria?: number | null;
  idModeloEtiqueta?: number | null;
  categoria?: Categoria | null;
  modeloEtiqueta?: ModeloEtiqueta | null;
}
