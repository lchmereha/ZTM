import type { Md3Palette } from 'themes/palette';

/** Superfícies MD3 sobrescritas no modo escuro. */
export type Md3SurfaceOverrides = Partial<Record<keyof Md3Palette, string>>;

/**
 * Identidade visual de um cliente. Tudo que difere entre as variantes do ZTM
 * mora aqui — o restante do código é único.
 *
 * A variante ativa é escolhida em tempo de build por `VITE_TENANT`.
 */
export interface TenantConfig {
  readonly id: string;
  readonly name: string;

  /** Semente do tema MD3 usada quando não há branding vindo do banco. */
  readonly seedColor: string;

  readonly defaultThemeMode: 'light' | 'dark' | 'system';

  /**
   * Quando `false`, a variante tem identidade fixa: `branding.primaryColor` e
   * `branding.logo` do banco são ignorados.
   */
  readonly useDatabaseBranding: boolean;

  /** Logo fixa da variante. `null` = usa o branding do banco / assets padrão. */
  readonly logo: string | null;
  readonly logoAlt: string;

  /** Se o usuário pode alternar entre claro e escuro pelo menu do header. */
  readonly allowThemeToggle: boolean;

  /** Papel de cor de item de menu selecionado e dos botões do header. */
  readonly accentRole: 'primary' | 'secondary';

  /** Superfície MD3 usada em AppBar, drawer e cards. */
  readonly chromeSurface: 'surfaceContainer' | 'surfaceBright';

  /**
   * Ajustes aplicados depois da geração MD3, apenas no modo escuro.
   * O esquema gerado a partir da semente não cobre paletas de marca que
   * misturam superfícies neutras com um acento de cor diferente.
   */
  readonly darkOverrides?: {
    readonly surfaces?: Md3SurfaceOverrides;
    readonly backgroundPaper?: string;
    readonly backgroundDefault?: string;
    /** Regenera a paleta secundária inteira a partir desta cor. */
    readonly secondarySeed?: string;
  };
}
