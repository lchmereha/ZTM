# Module Codemap

**Last Updated:** 2026-06-19

---

## Frontend Modules

### 1. Authentication Module

**Purpose**: User authentication, login form, session management, user state

**Location**: `frontend/src/contexts/AuthContext.tsx`

**Key Files**:
- `contexts/AuthContext.tsx` — Auth provider with user state, login/logout
- `views/pages/authentication/Login.tsx` — Login page
- `views/pages/auth-forms/AuthLogin.tsx` — Login form (Formik + Yup)
- `views/pages/authentication/SessionExpired.tsx` — Session expired page
- `routes/AuthGuard.tsx` — Route protection redirect
- `routes/GuestGuard.tsx` — Guest-only route guard
- `utils/axios.ts` — Axios interceptor (401 handling)

**Dependencies**:
- [Contexts](#react-contexts)
- [Routes](#routing)
- [Utils](#utility-layer)

**Exports**:
- `AuthProvider` - Context provider
- `useAuth` (via `AuthContext`) - Hook to access auth state
- `AuthUser`, `AuthFilial`, `AuthPermissao` - Auth types

---

### 2. Theme & Styling Module

**Purpose**: MUI theme customization with dark/light mode, branding colors, component overrides

**Location**: `frontend/src/themes/`

**Key Files**:
- `themes/index.tsx` — Theme provider with mode switching
- `themes/palette.tsx` — Color palette generation
- `themes/typography.tsx` — Font configuration
- `themes/custom-shadows.tsx` — Custom shadow definitions
- `themes/overrides/*.tsx` — 28 component style overrides
- `contexts/ConfigContext.tsx` — Theme config context
- `config.ts` — Default configuration values

**Dependencies**:
- MUI v9 (@mui/material, @emotion/react, @emotion/styled)
- @fontsource/roboto, @fontsource/inter, @fontsource/poppins

**Exports**:
- `ThemeCustomization` - Theme provider component
- `ConfigProvider`, `useConfig` - Theme config access
- Extended theme properties on MUI `createTheme`

---

### 3. Layout Module

**Purpose**: Application shell with sidebar, header, and content area

**Location**: `frontend/src/layout/`

**Key Files**:
- `layout/MainLayout/index.tsx` — Authenticated layout (sidebar + header + content)
- `layout/MainLayout/Header/index.tsx` — Top app bar
- `layout/MainLayout/Header/FilialSelector/` — Branch selector dropdown
- `layout/MainLayout/Header/OptionsSection/` — Theme toggle, profile, logout
- `layout/MainLayout/Sidebar/` — Navigation drawer
- `layout/MainLayout/MenuList/` — Menu navigation tree (NavGroup, NavCollapse, NavItem)
- `layout/MinimalLayout/` — Unauthenticated layout (login page)

**Dependencies**:
- [Contexts](#react-contexts) (AuthContext, ConfigContext)
- [UI Components](#ui-components)
- [Menu Items](#menu-items)

**Exports**:
- `MainLayout` - Main app layout component
- `MinimalLayout` - Auth pages layout

---

### 4. Menu Items Module

**Purpose**: Sidebar navigation menu structure definition

**Location**: `frontend/src/menu-items/`

**Key Files**:
- `menu-items/index.ts` — Menu item aggregation
- `menu-items/dashboard.ts` — Dashboard nav item
- `menu-items/pages.ts` — Pages nav items
- `menu-items/rfid.ts` — RFID section items (configurações, produtos, movimentações, consultas)
- `menu-items/utilities.ts` — Utility nav items
- `menu-items/other.ts` — Other nav items
- `menu-items/types.ts` — Menu item type definitions

**Dependencies**:
- [Layout MenuList](#layout-module)

---

### 5. DataTable Module

**Purpose**: jQuery DataTables integration for listing and managing tabular data

**Location**: `frontend/src/ui-component/datatable/`

**Key Files**:
- `ui-component/datatable/DataTable.tsx` — React wrapper for DataTables
- `ui-component/datatable/DataTableDialog.tsx` — CRUD modal dialog
- `ui-component/datatable/DataTableFilterDialog.tsx` — Column filter dialog
- `ui-component/datatable/index.ts` — Barrel exports
- `ui-component/datatable/datatable-responsive.css` — Responsive styles

**Dependencies**:
- datatables.net, datatables.net-dt, datatables.net-responsive-dt, datatables.net-select-dt
- [UI Components](#ui-components)
- [Utils](#utility-layer)

**Exports**:
- `DataTable` - Reusable data table component
- `DataTableDialog` - Modal for create/edit records

---

### 6. RFID Views Module

**Purpose**: All RFID-related page views (Configurações, Produtos, Movimentações, Consultas)

**Location**: `frontend/src/views/rfid/`

**Key Files**:
- `views/rfid/configuracoes/usuario/` — User CRUD pages
- `views/rfid/configuracoes/empresa/` — Company CRUD pages
- `views/rfid/configuracoes/filial/` — Branch CRUD pages
- `views/rfid/configuracoes/equipamento/` — Equipment CRUD pages
- `views/rfid/configuracoes/tipo-movimentacao/` — Movement type CRUD
- `views/rfid/configuracoes/api-key/` — API key management
- `views/rfid/configuracoes/posicao-estoque/` — Stock positions
- `views/rfid/produtos/categoria/` — Category CRUD
- `views/rfid/produtos/produto/` — Product CRUD
- `views/rfid/produtos/modelo-etiqueta/` — Label templates
- `views/rfid/produtos/tag-rfid/` — RFID tags CRUD
- `views/rfid/movimentacoes/movimentacao/` — Movement operations
- `views/rfid/consultas/posicao-estoque/` — Stock query
- `views/rfid/consultas/extrato-movimentacao/` — Movement history
- `views/rfid/consultas/entrada-saida/` — Entry/exit report

**Dependencies**:
- [DataTable Module](#5-datatable-module)
- [Models](#data-models)
- [API Endpoints](#api-layer)
- [Hooks](#hooks)

---

## Backend Modules

### 7. Auth Module

**Purpose**: JWT authentication, role-based authorization, API key validation

**Location**: `backend/src/auth/`

**Key Files**:
- `auth/auth.controller.ts` — Login/refresh endpoints
- `auth/auth.service.ts` — Authentication logic
- `auth/strategies/jwt.strategy.ts` — Passport JWT strategy
- `auth/guards/jwt-auth.guard.ts` — Global JWT guard
- `auth/guards/roles.guard.ts` — Role-based access control
- `auth/guards/api-key.guard.ts` — API key guard
- `auth/decorators/public.decorator.ts` — `@Public()` bypass decorator
- `auth/decorators/roles.decorator.ts` — `@Roles()` decorator

**Dependencies**:
- @nestjs/jwt, @nestjs/passport, passport, passport-jwt
- bcrypt (password hashing)
- [Prisma Module](#14-prisma-module)

**API Endpoints**:
- `POST /auth/login` — Authenticate, set JWT cookie
- `POST /auth/refresh` — Refresh JWT

---

### 8. Movement Module

**Purpose**: Core inventory movement management with batch RFID processing

**Location**: `backend/src/movimentacao/`

**Key Files**:
- `movimentacao/movimentacao.controller.ts` — CRUD endpoints
- `movimentacao/movimentacao.service.ts` — Business logic
- `movimentacao/batch-adapter.controller.ts` — Batch endpoints
- `movimentacao/services/batch-adapter.service.ts` — In-memory batch buffer
- `movimentacao/services/associacao.service.ts` — Tag association logic
- `movimentacao/services/conferencia.service.ts` — Conferencing logic
- `movimentacao/services/transferencia.service.ts` — Transfer logic
- `movimentacao/services/leitura.service.ts` — RFID read processing
- `movimentacao/services/importacao.service.ts` — CSV import
- `movimentacao/services/tag-processing.service.ts` — Tag state transitions
- `movimentacao/services/zpl-print.service.ts` — ZPL printing
- `movimentacao/services/base-movimentacao.service.ts` — Shared base class

**Dependencies**:
- [Auth Module](#7-auth-module) (RolesGuard)
- [Prisma Module](#14-prisma-module)
- [Common Module](#13-common-module)

**API Endpoints**: See [Backend Codemap](./BACKEND.md#movement-module-srcmovimentacao)

---

### 9. CRUD Modules

**Purpose**: Standard REST CRUD for all domain entities

**Location**: `backend/src/{module}/`

**Pattern**: Each module follows the NestJS convention:

| Module | Controller | Service | DTOs | Entity |
|--------|-----------|---------|------|--------|
| `empresa` | `empresa.controller.ts` | `empresa.service.ts` | `dto/` | — |
| `filial` | `filial.controller.ts`, `cep.controller.ts` | `filial.service.ts` | `dto/` | `entities/` |
| `equipamento` | `equipamento.controller.ts` | `equipamento.service.ts` | `dto/` | `entities/` |
| `produto` | `produto.controller.ts` | `produto.service.ts` | `dto/` | — |
| `categoria` | `categoria.controller.ts` | `categoria.service.ts` | `dto/` | — |
| `tag-rfid` | `tag-rfid.controller.ts` | `tag-rfid.service.ts` | `dto/` | — |
| `usuario` | `usuario.controller.ts` | `usuario.service.ts` | `dto/` | — |
| `permissao` | `permissao.controller.ts` | `permissao.service.ts` | `dto/` | — |
| `modelo-etiqueta` | `modelo-etiqueta.controller.ts` | `modelo-etiqueta.service.ts` | `dto/` | — |
| `tipo-movimentacao` | `tipo-movimentacao.controller.ts` | `tipo-movimentacao.service.ts` | `dto/` | — |
| `posicao-estoque` | `posicao-estoque.controller.ts` | `posicao-estoque.service.ts` | `dto/` | — |
| `api-key` | `api-key.controller.ts` | `api-key.service.ts` | `dto/` | — |

**Dependencies**:
- [Prisma Module](#14-prisma-module)
- [Common Module](#13-common-module)
- DTOs with class-validator decorators

---

### 10. Dashboard Module

**Purpose**: Aggregated KPI data for the main dashboard

**Location**: `backend/src/dashboard/`

**Key Files**:
- `dashboard/dashboard.controller.ts` — KPI endpoints
- `dashboard/dashboard.service.ts` — Aggregation queries
- `dashboard/dto/` — Dashboard DTOs

**Dependencies**:
- [Prisma Module](#14-prisma-module)

---

### 11. Integration Module

**Purpose**: External API for third-party system integration

**Location**: `backend/src/integracao/`

**Key Files**:
- `integracao/integracao.controller.ts` — External endpoints
- `integracao/integracao.service.ts` — Integration logic
- `integracao/dto/` — Integration DTOs

**Dependencies**:
- API Key guard
- Swagger (documented in `/docs`)
- [Prisma Module](#14-prisma-module)

---

### 12. Report Module

**Purpose**: Report generation and export

**Location**: `backend/src/relatorio/`

**Key Files**:
- `relatorio/relatorio.controller.ts` — Report endpoints
- `relatorio/relatorio.service.ts` — Report generation
- `relatorio/relatorio.module.ts` — Module declaration

**Dependencies**:
- [Prisma Module](#14-prisma-module)

---

### 13. Common Module

**Purpose**: Shared utilities, filters, interceptors, helpers

**Location**: `backend/src/common/`

**Key Files**:
- `common/common.module.ts` — Module declaration, global exports
- `common/dto/datatables.dto.ts` — Generic DataTables request DTO
- `common/filters/database-exception.filter.ts` — Prisma error → user-friendly response
- `common/interceptors/normalize.interceptor.ts` — snake_case → camelCase
- `common/interceptors/sliding-token.interceptor.ts` — JWT refresh on write
- `common/helpers/datatables.helper.ts` — Pagination helper
- `common/helpers/normalize.helper.ts` — Recursive key case conversion
- `common/interfaces/authenticated-request.interface.ts` — Typed Request with user
- `common/services/tenant.service.ts` — Filial context resolution

**Dependencies**:
- @nestjs/common
- rxjs

---

### 14. Prisma Module

**Purpose**: Database connection, query execution, client lifecycle

**Location**: `backend/src/prisma/`

**Key Files**:
- `prisma/prisma.module.ts` — Global module declaration
- `prisma/prisma.service.ts` — PrismaClient wrapper with onModuleInit/onModuleDestroy

**Dependencies**:
- @prisma/client, @prisma/adapter-mariadb
- Generated client: `src/generated/prisma/`

---

## Mobile Modules

### 15. Login Module

**Purpose**: User authentication on mobile device

**Location**: `mobile/lib/src/modules/login/`

**Key Files**:
- `login/controllers/login_controller.dart` — Login controller
- `login/views/login_view.dart` — Login screen UI

**Dependencies**:
- [Auth API](#api-services-servicesapi)
- [HTTP Client](#http-client-serviceshttp)

---

### 16. Home Module

**Purpose**: Main RFID operation dashboard

**Location**: `mobile/lib/src/modules/home/`

**Key Files**:
- `home/controllers/home_controller.dart` — Home state management
- `home/views/home_view.dart` — Home screen
- `home/widgets/` — Home screen widgets

**Dependencies**:
- [RFID Reader Panel Components](#rfid-reader-panel-componentscomponentsrfid_reader_panel)
- [Movement API](#api-services-servicesapi)
- [Hardware Services](#hardware-services)

---

### 17. Hardware Services Module

**Purpose**: Integration with RFID reader and barcode scanner hardware

**Location**: `mobile/lib/src/services/{rfid,scanner,zpl}/`

**Key Files**:
- `services/rfid/rfid.dart` — RFID BLE communication
- `services/scanner/scanner.dart` — Camera barcode scanning
- `services/zpl/zpl_print_service.dart` — ZPL label printing over TCP

**Dependencies**:
- Custom packages: `barcode_scanner`, `rfid_reader`
- flutter_blue_plus (BLE)
- path_provider (file system)

---

## Cross-Cutting Concerns

### Utility Layer
| Location | Key Files | Purpose |
|----------|-----------|---------|
| `frontend/src/utils/` | `axios.ts` | HTTP client with interceptors |
| `frontend/src/utils/` | `getImageUrl.ts` | Image URL helper |
| `frontend/src/utils/` | `colorUtils.ts` | Color manipulation |
| `frontend/src/utils/` | `imageUtils.ts` | Image processing |
| `mobile/lib/src/utils/` | `get_foreground_color.dart` | Foreground color contrast |

### API Layer
| Frontend | Backend |
|----------|---------|
| `src/store/endpoints/rfidEndpoints.ts` | All CRUD endpoint paths |
| `src/store/endpoints/dashboardEndpoints.ts` | Dashboard endpoint |
| `src/api/menu.ts` | Menu structure from backend |
| `src/services/rfid/` | WebSocket + tag manager |
| `backend/src/*/controller.ts` | REST controllers |
| `backend/src/*/service.ts` | Business logic |

### React Contexts
| Context | Provider | Purpose |
|---------|----------|---------|
| AuthContext | `AuthProvider` | Authentication state |
| ConfigContext | `ConfigProvider` | Theme configuration |
| DialogContext | `DialogProvider` | Confirmation dialogs |
| SnackbarContext | `SnackbarProvider` | Toast notifications |

### Hooks
| Hook | Purpose |
|------|---------|
| `useConfig` | Access theme config |
| `useContextFilter` | Data table filter state |
| `useDialog` | Confirmation dialog trigger |
| `useErrorHandler` | Centralized API error handling |
| `useLocalStorage` | Type-safe localStorage |
| `useMenuCollapse` | Sidebar collapse toggle |
| `useSnackbar` | Toast notification trigger |
