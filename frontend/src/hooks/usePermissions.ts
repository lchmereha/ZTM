import { useAuth } from 'contexts/AuthContext';

export const usePermissions = (permissionKey?: string) => {
  const { user } = useAuth();

  if (!permissionKey) {
    return {
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true
    };
  }

  if (user?.regra === 'ADMIN') {
    return {
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true
    };
  }

  const perm = user?.permissoes?.find((p) => p.chave === permissionKey);

  return {
    podeVisualizar: !!perm?.podeVisualizar,
    podeIncluir: !!perm?.podeIncluir,
    podeAlterar: !!perm?.podeAlterar,
    podeExcluir: !!perm?.podeExcluir
  };
};
