# Frontend Codemap

**Last Updated:** 2026-06-19
**Framework:** React 19 + TypeScript 5.9
**Build:** Vite 8 + rolldown
**Entry Point:** `src/index.tsx`

---

## Application Structure

```
frontend/src/
├── index.tsx              # ReactDOM.createRoot, font imports, ConfigProvider wrapper
├── App.tsx                # Root component: providers → router
├── vite-env.d.ts          # Vite environment types
├── config.ts              # App configuration (theme defaults, font, borderRadius)
│
├── api/                   # Menu API definitions
├── assets/                # Static assets (images, SCSS)
├── contexts/              # React contexts (global state)
├── hooks/                 # Custom React hooks
├── interfaces/            # TypeScript interfaces
├── layout/                # Layout components (shell)
├── menu-items/            # Sidebar menu structure
├── models/                # Data models (mirrors backend entities)
├── routes/                # Route configuration & guards
├── services/              # External service integrations
├── store/                 # Constants & endpoint definitions
├── themes/                # MUI theme customization
├── ui-component/          # Reusable UI components
├── utils/                 # Utility functions (Axios, helpers)
└── views/                 # Page-level components
```

---

## App Initialization Flow

```
index.tsx
  └── ConfigProvider
       └── App.tsx
            ├── AuthProvider (authentication state)
            │   └── ThemeCustomization (MUI theme)
            │       └── NavigationScroll (scroll restoration)
            │           └── SnackbarProvider (toast notifications)
            │               └── DialogProvider (confirmation dialogs)
            │                   └── RouterProvider (react-router)
            │                       ├── AuthenticationRoutes (login, session-expired)
            │                       └── MainRoutes (authenticated)
            │                           ├── AuthGuard → MainLayout
            │                           │   ├── Header (filial selector, options)
            │                           │   ├── Sidebar (navigation menu)
            │                           │   └── <Outlet /> (page content)
            │                           └── RoleGuard (per-page RBAC)
            └── GuestGuard → Login page (unauthenticated)
```

---

## Routing

**File:** `src/routes/`

| File | Purpose |
|------|---------|
| `index.tsx` | Combines MainRoutes + AuthenticationRoutes |
| `MainRoutes.tsx` | All authenticated routes (dashboard, configurações, produtos, movimentações, consultas) |
| `AuthenticationRoutes.tsx` | Login, session-expired pages |
| `AuthGuard.tsx` | Redirects to login if not authenticated |
| `GuestGuard.tsx` | Redirects to dashboard if already authenticated |
| `RoleGuard.tsx` | Checks user role/permissions for page access |
| `ErrorBoundary.tsx` | React error boundary for route-level errors |

### Route Tree
```
/                           → Dashboard (Default)
/dashboard/default          → Dashboard

/configuracoes/
  usuario                   → User management
  empresa                   → Company management
  filial                    → Branch management
  equipamento               → RFID equipment management
  tipo-movimentacao         → Movement types
  api-key                   → API key management
  posicao-estoque           → Stock positions

/produtos/
  categoria                 → Categories
  produto                   → Products
  modelo-etiqueta           ← Label templates (note: "←" indicates listing page path issue)
  modelo-etiqueta           → Label templates
  tag-rfid                  → RFID tags

/movimentacoes/
  movimentacao              → Inventory movements

/consultas/
  posicao-estoque           → Stock position query
  extrato-movimentacao      → Movement history
  entrada-saida             → Entry/exit report

/auth/
  login                     → Login page
  session-expired           → Session expired notification
```

---

## Contexts (`src/contexts/`)

| Context | File | Purpose |
|---------|------|---------|
| **AuthContext** | `AuthContext.tsx` | User authentication state, login/logout, session management, branding |
| **ConfigContext** | `ConfigContext.tsx` | App configuration (theme mode, color, font) |
| **DialogContext** | `DialogContext.tsx` | Confirmation dialog management |
| **SnackbarContext** | `SnackbarContext.tsx` | Toast notifications |

---

## Hooks (`src/hooks/`)

| Hook | File | Purpose |
|------|------|---------|
| `useConfig` | `useConfig.ts` | Access ConfigContext |
| `useContextFilter` | `useContextFilter.ts` | Filter state management |
| `useDialog` | `useDialog.ts` | Access DialogContext |
| `useErrorHandler` | `useErrorHandler.tsx` | Centralized API error handling |
| `useLocalStorage` | `useLocalStorage.ts` | Typed localStorage wrapper |
| `useMenuCollapse` | `useMenuCollapse.ts` | Sidebar collapse state |
| `useSnackbar` | `useSnackbar.ts` | Access SnackbarContext |

---

## Layout (`src/layout/`)

```
layout/
├── MainLayout/             # Authenticated layout shell
│   ├── index.tsx           # Header + Sidebar + Content area
│   ├── MainContentStyled.ts  # Styled content area with dynamic margins
│   ├── HorizontalBar.tsx   # Horizontal navigation variant
│   ├── Header/
│   │   ├── index.tsx       # App bar with mobile menu toggle
│   │   ├── FilialSelector/ # Active branch/filial dropdown
│   │   └── OptionsSection/  # Theme toggle, profile, logout
│   ├── Sidebar/
│   │   ├── index.tsx       # Navigation drawer
│   │   └── MiniDrawerStyled.ts  # Collapsible drawer styles
│   └── MenuList/
│       ├── index.tsx       # MenuList container
│       ├── NavGroup/       # Menu group renderer
│       ├── NavCollapse/    # Collapsible menu item
│       └── NavItem/        # Single menu item
├── MinimalLayout/          # Unauthenticated layout (login)
└── NavigationScroll.tsx    # Scroll to top on route change
```

---

## View Pages (`src/views/`)

### Dashboard
```
views/dashboard/Default/
├── index.tsx               # Dashboard page (grid layout)
├── KpiCard.tsx             # KPI metric card
├── PopularCard.tsx         # Popular items card
├── TopProdutosCard.tsx     # Top products card
└── TotalGrowthBarChart.tsx # Growth chart (ApexCharts)
```

### RFID Configurações (Settings)
```
views/rfid/configuracoes/
├── usuario/                # User CRUD pages
├── empresa/                # Company CRUD pages
├── filial/                 # Branch CRUD pages
├── equipamento/            # RFID Equipment CRUD pages
├── tipo-movimentacao/      # Movement type CRUD pages
├── api-key/                # API Key management pages
└── posicao-estoque/        # Stock position CRUD pages
```

### RFID Produtos (Products)
```
views/rfid/produtos/
├── categoria/              # Category CRUD pages
├── produto/                # Product CRUD pages
├── modelo-etiqueta/        # Label template CRUD pages
└── tag-rfid/               # RFID tag CRUD pages
```

### RFID Movimentações (Movements)
```
views/rfid/movimentacoes/
└── movimentacao/           # Movement detail & operation pages
```

### RFID Consultas (Queries)
```
views/rfid/consultas/
├── posicao-estoque/        # Stock position query page
├── extrato-movimentacao/   # Movement history page
└── entrada-saida/          # Entry/exit report page
```

### Authentication
```
views/pages/
├── authentication/
│   ├── AuthCardWrapper.tsx  # Card wrapper for auth forms
│   ├── AuthWrapper1.tsx     # Auth page layout
│   ├── Login.tsx            # Login page
│   └── SessionExpired.tsx   # Session expired page
└── auth-forms/
    └── AuthLogin.tsx        # Login form (Formik + Yup)
```

---

## UI Components (`src/ui-component/`)

### Cards
| Component | Description |
|-----------|-------------|
| `MainCard.tsx` | Reusable card wrapper with title, subtitle, actions |
| `AuthFooter.tsx` | Footer shown on auth pages |
| `TotalIncomeDarkCard.tsx` | Dark income statistic card |
| `TotalIncomeLightCard.tsx` | Light income statistic card |
| `Skeleton/EarningCard.tsx` | Loading skeleton |
| `Skeleton/PopularCard.tsx` | Loading skeleton |
| `Skeleton/TotalGrowthBarChart.tsx` | Loading skeleton |
| `Skeleton/TotalIncomeCard.tsx` | Loading skeleton |

### Extended
| Component | Description |
|-----------|-------------|
| `AnimateButton.tsx` | Framer Motion animated button wrapper |
| `AutocompleteMulti.tsx` | Multi-select autocomplete |
| `Breadcrumbs.tsx` | Navigation breadcrumbs |
| `Transitions.tsx` | Framer Motion transitions |
| `Form/CustomFormControl.tsx` | Custom form control wrapper |
| `Form/FormControl.tsx` | Form field with validation display |
| `Form/FormControlSelect.tsx` | Select form field |
| `Form/InputLabel.tsx` | Styled input label |

### DataTable
| Component | Description |
|-----------|-------------|
| `DataTable.tsx` | jQuery DataTables wrapper for React |
| `DataTableDialog.tsx` | Modal dialog for DataTables |
| `DataTableFilterDialog.tsx` | Filter configuration dialog |
| `datatable-responsive.css` | Responsive DataTables styles |

### Third-Party
| Component | Description |
|-----------|-------------|
| `SimpleBar.tsx` | Custom scrollbar (SimpleBar) |

### Utility Components
| Component | Description |
|-----------|-------------|
| `Loadable.tsx` | Lazy loading Suspense wrapper |
| `Loader.tsx` | Loading spinner |
| `Logo.tsx` | App logo |

---

## Data Models (`src/models/`)

All frontend models mirror backend Prisma entities:

| File | Model | Backend Entity |
|------|-------|----------------|
| `usuario.ts` | Usuario | User |
| `empresa.ts` | Empresa | Company |
| `filial.ts` | Filial | Branch |
| `equipamento.ts` | Equipamento | Equipment |
| `produto.ts` | Produto | Product |
| `categoria.ts` | Categoria | Category |
| `tag-rfid.ts` | TagRfid | RFID Tag |
| `tipo-movimentacao.ts` | TipoMovimentacao | Movement Type |
| `movimentacao.ts` | Movimentacao | Movement |
| `movimentacao-item.ts` | MovimentacaoItem | Movement Items |
| `modelo-etiqueta.ts` | ModeloEtiqueta | Label Template |
| `permissao-usuario.ts` | PermissaoUsuario | User Permission |
| `usuario-filial.ts` | UsuarioFilial | User-Branch assignment |
| `posicao-estoque.ts` | PosicaoEstoque | Stock Position |
| `api-key.ts` | ApiKey | API Key |
| `opcao-menu.ts` | OpcaoMenu | Menu Option |
| `importacao-item.ts` | ImportacaoItem | Import Item |
| `enums.ts` | Enums | Shared enum types |
| `uf.ts` | UF | Brazilian states |
| `index.ts` | — | Barrel exports |

---

## API Layer

### Axios Client (`src/utils/axios.ts`)
- Base URL from `VITE_BACKEND_URL` env var
- `withCredentials: true` for httpOnly cookie auth
- Response interceptor handles 401 → session-expired redirect
- Custom `ApiError` class with structured error details

### Endpoints (`src/store/endpoints/`)
- `rfidEndpoints.ts` — All CRUD endpoint path constants
- `dashboardEndpoints.ts` — Dashboard endpoint constants

### API Menu (`src/api/menu.ts`)
- Menu structure fetched from backend permissions

---

## Services (`src/services/`)

### RFID Services
```
services/rfid/
├── types.ts                    # RfidTag, RfidTagWithCounter interfaces
├── RfidTagManager.ts           # RFID tag state management
├── RfidWebSocketService.ts     # WebSocket connection for real-time RFID reads
└── criterios/
    ├── types.ts                # Validation criteria types
    └── CriteriosValidator.ts   # Tag validation against business rules
```

---

## Theme System (`src/themes/`)

```
themes/
├── index.tsx                   # Theme provider with mode switching
├── palette.tsx                 # Color palette (primary, secondary, etc.)
├── typography.tsx              # Font settings (Poppins, Roboto, Inter)
├── custom-shadows.tsx          # Custom shadow definitions
└── overrides/                  # MUI component style overrides
    ├── index.ts                # Barrel export
    ├── *.tsx                   # Individual component overrides (28 files)
```

- Theme mode: `system` | `light` | `dark` (default: `system`)
- Primary color: `#F07E23` (configurable via branding)
- Fonts: Poppins (UI), Roboto (MUI default), Inter (alternate)

---

## Key Configuration

**`src/config.ts`:**
```typescript
export const DASHBOARD_PATH = '/';
export const DEFAULT_THEME_MODE = 'system';
export const DEFAULT_APP_COLOR = '#F07E23';
```

**`src/store/constant.ts`:**
```typescript
export const gridSpacing = 3;
export const drawerWidth = 260;
export const appDrawerWidth = 320;
```
