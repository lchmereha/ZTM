# File Codemap

**Last Updated:** 2026-06-19

---

## Root Level

| Path | Purpose |
|------|---------|
| `package.json` | Root dependencies (ecc-universal) |
| `docker-compose-local.yml` | Local deployment with MySQL + backend + frontend (production builds) |
| `docker-compose-development.yml` | Development environment (backend watch mode, external frontend) |
| `docker-compose-production.yml` | Production deployment |
| `.env.example` | Environment variable template |
| `README.md` | Project overview |

---

## Backend

### Configuration & Build

| Path | Purpose |
|------|---------|
| `backend/package.json` | NestJS dependencies, scripts |
| `backend/nest-cli.json` | NestJS CLI configuration |
| `backend/tsconfig.json` | TypeScript config |
| `backend/tsconfig.build.json` | Build-specific TS config |
| `backend/prisma.config.ts` | Prisma configuration |
| `backend/.env.example` | Template env file |
| `backend/.env.development.example` | Development env template |
| `backend/.env.local.example` | Local env template |
| `backend/.env.production.example` | Production env template |
| `backend/Dockerfile.production` | Multi-stage production Docker build |
| `backend/Dockerfile.development` | Development Docker build with watch |
| `backend/docker-entrypoint.sh` | Docker entrypoint script |
| `backend/eslint.config.mjs` | ESLint flat config |
| `backend/.prettierrc` | Prettier config |

### Entry Points

| Path | Purpose |
|------|---------|
| `backend/src/main.ts` | NestJS bootstrap: middleware, CORS, Swagger, ValidationPipe |
| `backend/src/app.module.ts` | Root module: global guards, filters, interceptors, all feature modules |
| `backend/src/app.controller.ts` | Health check endpoint |
| `backend/src/app.service.ts` | App service |

### Auth Module

| Path | Purpose |
|------|---------|
| `backend/src/auth/auth.module.ts` | Auth module declaration |
| `backend/src/auth/auth.controller.ts` | POST /auth/login, POST /auth/refresh |
| `backend/src/auth/auth.service.ts` | Login validation, JWT generation, password hashing |
| `backend/src/auth/strategies/jwt.strategy.ts` | Passport JWT extraction (cookie + bearer) |
| `backend/src/auth/guards/jwt-auth.guard.ts` | Global JWT verification guard |
| `backend/src/auth/guards/roles.guard.ts` | Role-based access control guard |
| `backend/src/auth/guards/api-key.guard.ts` | API key validation for external integration |
| `backend/src/auth/decorators/public.decorator.ts` | `@Public()` route bypass |
| `backend/src/auth/decorators/roles.decorator.ts` | `@Roles('ADMIN')` decorator |

### Prisma Module

| Path | Purpose |
|------|---------|
| `backend/src/prisma/prisma.module.ts` | Global module, exports PrismaService |
| `backend/src/prisma/prisma.service.ts` | Singleton PrismaClient, lifecycle hooks |
| `backend/prisma/schema.prisma` | Full database schema (14 models) |
| `backend/prisma/seed.ts` | Database seed script |
| `backend/prisma/migrations/` | Migration history |

### Common Module

| Path | Purpose |
|------|---------|
| `backend/src/common/common.module.ts` | Common module declaration |
| `backend/src/common/dto/datatables.dto.ts` | Generic pagination/sorting/filtering DTO |
| `backend/src/common/filters/database-exception.filter.ts` | Prisma error handler |
| `backend/src/common/interceptors/normalize.interceptor.ts` | Response case conversion |
| `backend/src/common/interceptors/sliding-token.interceptor.ts` | JWT refresh on writes |
| `backend/src/common/helpers/datatables.helper.ts` | Pagination/order query builder |
| `backend/src/common/helpers/normalize.helper.ts` | Recursive case conversion helper |
| `backend/src/common/interfaces/authenticated-request.interface.ts` | Typed request with user |
| `backend/src/common/services/tenant.service.ts` | Tenant/filial context |

### CRUD Modules

| Path | Purpose |
|------|---------|
| `backend/src/empresa/` | Company CRUD |
| `backend/src/filial/filial.controller.ts` | Branch CRUD |
| `backend/src/filial/cep.controller.ts` | CEP (Brazilian zip code) lookup |
| `backend/src/equipamento/` | RFID Equipment CRUD |
| `backend/src/produto/` | Product CRUD |
| `backend/src/categoria/` | Category CRUD |
| `backend/src/tag-rfid/` | RFID Tag CRUD |
| `backend/src/usuario/` | User CRUD |
| `backend/src/permissao/` | Permission CRUD |
| `backend/src/modelo-etiqueta/` | Label template CRUD |
| `backend/src/tipo-movimentacao/` | Movement type CRUD |
| `backend/src/posicao-estoque/` | Stock position CRUD |
| `backend/src/api-key/` | API Key CRUD + generation |

### Domain-Specific Modules

| Path | Purpose |
|------|---------|
| `backend/src/movimentacao/movimentacao.controller.ts` | Movement CRUD |
| `backend/src/movimentacao/movimentacao.service.ts` | Movement business logic |
| `backend/src/movimentacao/batch-adapter.controller.ts` | Batch processing endpoints |
| `backend/src/movimentacao/services/batch-adapter.service.ts` | In-memory batch buffer |
| `backend/src/movimentacao/services/associacao.service.ts` | Tag association |
| `backend/src/movimentacao/services/conferencia.service.ts` | Inventory conference |
| `backend/src/movimentacao/services/transferencia.service.ts` | Inter-branch transfer |
| `backend/src/movimentacao/services/leitura.service.ts` | RFID reading |
| `backend/src/movimentacao/services/importacao.service.ts` | CSV import |
| `backend/src/movimentacao/services/tag-processing.service.ts` | Tag state transitions |
| `backend/src/movimentacao/services/zpl-print.service.ts` | ZPL printing |
| `backend/src/movimentacao/services/base-movimentacao.service.ts` | Base class |
| `backend/src/dashboard/dashboard.controller.ts` | Dashboard KPI endpoints |
| `backend/src/dashboard/dashboard.service.ts` | Aggregation queries |
| `backend/src/integracao/integracao.controller.ts` | External integration API |
| `backend/src/integracao/integracao.service.ts` | Integration logic |
| `backend/src/relatorio/relatorio.controller.ts` | Report endpoints |
| `backend/src/relatorio/relatorio.service.ts` | Report generation |

### Tests

| Path | Purpose |
|------|---------|
| `backend/test/` | E2E test configuration |
| `backend/src/**/*.spec.ts` | Unit tests for controllers/services |

---

## Frontend

### Configuration & Build

| Path | Purpose |
|------|---------|
| `frontend/package.json` | React 19 + MUI v9 dependencies |
| `frontend/vite.config.mts` | Vite build configuration |
| `frontend/tsconfig.json` | TypeScript config |
| `frontend/tsconfig.app.json` | App-specific TS config |
| `frontend/tsconfig.node.json` | Node-specific TS config |
| `frontend/eslint.config.mts` | ESLint flat config |
| `frontend/.prettierrc` | Prettier config |
| `frontend/.yarnrc.yml` | Yarn 4 config |
| `frontend/index.html` | HTML entry point |
| `frontend/favicon.ico` | App favicon |
| `frontend/Dockerfile.production` | Nginx-based production build |
| `frontend/Dockerfile.development` | Development build |
| `frontend/nginx.conf` | Nginx reverse proxy config |
| `frontend/eslint-plugins.d.ts` | ESLint plugin type declarations |

### Entry Points

| Path | Purpose |
|------|---------|
| `frontend/src/index.tsx` | App bootstrap: fonts, ConfigProvider, ReactDOM |
| `frontend/src/App.tsx` | Root: providers → router |
| `frontend/src/config.ts` | App defaults (theme, font, colors) |
| `frontend/src/vite-env.d.ts` | Vite environment types |

### Contexts

| Path | Purpose |
|------|---------|
| `frontend/src/contexts/AuthContext.tsx` | Auth state, login/logout, user, branding |
| `frontend/src/contexts/ConfigContext.tsx` | Theme config (mode, palette) |
| `frontend/src/contexts/DialogContext.tsx` | Confirmation dialogs |
| `frontend/src/contexts/SnackbarContext.tsx` | Toast notifications |

### Hooks

| Path | Purpose |
|------|---------|
| `frontend/src/hooks/useConfig.ts` | Theme config hook |
| `frontend/src/hooks/useContextFilter.ts` | Data filter state hook |
| `frontend/src/hooks/useDialog.ts` | Dialog trigger hook |
| `frontend/src/hooks/useErrorHandler.tsx` | API error handler hook |
| `frontend/src/hooks/useLocalStorage.ts` | LocalStorage wrapper hook |
| `frontend/src/hooks/useMenuCollapse.ts` | Sidebar collapse hook |
| `frontend/src/hooks/useSnackbar.ts` | Toast hook |

### Routing

| Path | Purpose |
|------|---------|
| `frontend/src/routes/index.tsx` | Route aggregation |
| `frontend/src/routes/MainRoutes.tsx` | Authenticated route definitions |
| `frontend/src/routes/AuthenticationRoutes.tsx` | Login/session-expired routes |
| `frontend/src/routes/AuthGuard.tsx` | Auth redirect guard |
| `frontend/src/routes/GuestGuard.tsx` | Guest-only guard |
| `frontend/src/routes/RoleGuard.tsx` | RBAC page guard |
| `frontend/src/routes/ErrorBoundary.tsx` | React error boundary |

### Layout

| Path | Purpose |
|------|---------|
| `frontend/src/layout/MainLayout/index.tsx` | Main shell: Header + Sidebar + Content |
| `frontend/src/layout/MainLayout/MainContentStyled.ts` | Content area styles |
| `frontend/src/layout/MainLayout/HorizontalBar.tsx` | Horizontal nav variant |
| `frontend/src/layout/MainLayout/Header/index.tsx` | App bar |
| `frontend/src/layout/MainLayout/Header/FilialSelector/index.tsx` | Branch selector |
| `frontend/src/layout/MainLayout/Header/OptionsSection/index.tsx` | User options |
| `frontend/src/layout/MainLayout/Sidebar/index.tsx` | Navigation drawer |
| `frontend/src/layout/MainLayout/Sidebar/MiniDrawerStyled.ts` | Mini drawer styles |
| `frontend/src/layout/MainLayout/MenuList/index.tsx` | Menu container |
| `frontend/src/layout/MainLayout/MenuList/NavGroup/` | Group renderer |
| `frontend/src/layout/MainLayout/MenuList/NavCollapse/` | Collapsible item |
| `frontend/src/layout/MainLayout/MenuList/NavItem/` | Single menu item |
| `frontend/src/layout/MinimalLayout/` | Auth layout |
| `frontend/src/layout/NavigationScroll.tsx` | Scroll-to-top |

### Views

| Path | Purpose |
|------|---------|
| `frontend/src/views/dashboard/Default/index.tsx` | Dashboard page |
| `frontend/src/views/dashboard/Default/KpiCard.tsx` | KPI card |
| `frontend/src/views/dashboard/Default/PopularCard.tsx` | Popular items |
| `frontend/src/views/dashboard/Default/TopProdutosCard.tsx` | Top products |
| `frontend/src/views/dashboard/Default/TotalGrowthBarChart.tsx` | Growth chart |

| Path | Purpose |
|------|---------|
| `frontend/src/views/rfid/configuracoes/usuario/` | User pages |
| `frontend/src/views/rfid/configuracoes/empresa/` | Company pages |
| `frontend/src/views/rfid/configuracoes/filial/` | Branch pages |
| `frontend/src/views/rfid/configuracoes/equipamento/` | Equipment pages |
| `frontend/src/views/rfid/configuracoes/tipo-movimentacao/` | Movement type pages |
| `frontend/src/views/rfid/configuracoes/api-key/` | API Key pages |
| `frontend/src/views/rfid/configuracoes/posicao-estoque/` | Stock position pages |
| `frontend/src/views/rfid/produtos/categoria/` | Category pages |
| `frontend/src/views/rfid/produtos/produto/` | Product pages |
| `frontend/src/views/rfid/produtos/modelo-etiqueta/` | Label template pages |
| `frontend/src/views/rfid/produtos/tag-rfid/` | RFID tag pages |
| `frontend/src/views/rfid/movimentacoes/movimentacao/` | Movement pages |
| `frontend/src/views/rfid/consultas/posicao-estoque/` | Stock query page |
| `frontend/src/views/rfid/consultas/extrato-movimentacao/` | Movement history |
| `frontend/src/views/rfid/consultas/entrada-saida/` | Entry/exit report |

| Path | Purpose |
|------|---------|
| `frontend/src/views/pages/authentication/Login.tsx` | Login page |
| `frontend/src/views/pages/authentication/SessionExpired.tsx` | Session expired |
| `frontend/src/views/pages/authentication/AuthCardWrapper.tsx` | Auth card wrapper |
| `frontend/src/views/pages/authentication/AuthWrapper1.tsx` | Auth layout |
| `frontend/src/views/pages/auth-forms/AuthLogin.tsx` | Login form |

### UI Components

| Path | Purpose |
|------|---------|
| `frontend/src/ui-component/Loadable.tsx` | Lazy loading wrapper |
| `frontend/src/ui-component/Loader.tsx` | Spinner |
| `frontend/src/ui-component/Logo.tsx` | App logo |
| `frontend/src/ui-component/cards/MainCard.tsx` | Reusable card |
| `frontend/src/ui-component/cards/AuthFooter.tsx` | Auth footer |
| `frontend/src/ui-component/cards/TotalIncomeDarkCard.tsx` | Dark card |
| `frontend/src/ui-component/cards/TotalIncomeLightCard.tsx` | Light card |
| `frontend/src/ui-component/cards/Skeleton/*.tsx` | Loading skeletons |
| `frontend/src/ui-component/extended/AnimateButton.tsx` | Animation wrapper |
| `frontend/src/ui-component/extended/AutocompleteMulti.tsx` | Multi-select |
| `frontend/src/ui-component/extended/Breadcrumbs.tsx` | Breadcrumbs |
| `frontend/src/ui-component/extended/Transitions.tsx` | Transitions |
| `frontend/src/ui-component/extended/Form/*.tsx` | Form components |
| `frontend/src/ui-component/datatable/DataTable.tsx` | DataTable wrapper |
| `frontend/src/ui-component/datatable/DataTableDialog.tsx` | CRUD modal |
| `frontend/src/ui-component/datatable/DataTableFilterDialog.tsx` | Filter dialog |
| `frontend/src/ui-component/third-party/SimpleBar.tsx` | Custom scrollbar |

### Themes

| Path | Purpose |
|------|---------|
| `frontend/src/themes/index.tsx` | Theme provider |
| `frontend/src/themes/palette.tsx` | Color palette |
| `frontend/src/themes/typography.tsx` | Font settings |
| `frontend/src/themes/custom-shadows.tsx` | Custom shadows |
| `frontend/src/themes/overrides/index.ts` | Component overrides barrel |
| `frontend/src/themes/overrides/*.tsx` (28 files) | Individual component overrides |

### Services & API

| Path | Purpose |
|------|---------|
| `frontend/src/services/rfid/RfidTagManager.ts` | RFID tag state manager |
| `frontend/src/services/rfid/RfidWebSocketService.ts` | WebSocket for real-time RFID |
| `frontend/src/services/rfid/types.ts` | RFID types |
| `frontend/src/services/rfid/criterios/CriteriosValidator.ts` | Tag validation rules |
| `frontend/src/services/rfid/criterios/types.ts` | Validation types |
| `frontend/src/api/menu.ts` | Menu structure API |
| `frontend/src/store/endpoints/rfidEndpoints.ts` | All endpoint paths |
| `frontend/src/store/endpoints/dashboardEndpoints.ts` | Dashboard endpoint |
| `frontend/src/store/constant.ts` | App constants |

### Utils

| Path | Purpose |
|------|---------|
| `frontend/src/utils/axios.ts` | Axios client with interceptors |
| `frontend/src/utils/getImageUrl.ts` | Image URL resolver |
| `frontend/src/utils/colorUtils.ts` | Color utilities |
| `frontend/src/utils/imageUtils.ts` | Image utilities |

### Data Models

| Path | Purpose |
|------|---------|
| `frontend/src/models/*.ts` (20 files) | TypeScript data models |

### Interfaces

| Path | Purpose |
|------|---------|
| `frontend/src/interfaces/*.ts` (15 files) | TypeScript interfaces |

### Menu Items

| Path | Purpose |
|------|---------|
| `frontend/src/menu-items/dashboard.ts` | Dashboard menu |
| `frontend/src/menu-items/rfid.ts` | RFID menu section |
| `frontend/src/menu-items/pages.ts` | Pages menu |
| `frontend/src/menu-items/utilities.ts` | Utilities menu |
| `frontend/src/menu-items/other.ts` | Other menu |
| `frontend/src/menu-items/types.ts` | Menu type definitions |
| `frontend/src/menu-items/index.ts` | Menu aggregation |

### Assets

| Path | Purpose |
|------|---------|
| `frontend/src/assets/images/` | Static images |
| `frontend/src/assets/scss/style.scss` | Global SCSS styles |

---

## Mobile

### Configuration

| Path | Purpose |
|------|---------|
| `mobile/pubspec.yaml` | Flutter dependencies |
| `mobile/pubspec.lock` | Locked dependencies |
| `mobile/analysis_options.yaml` | Dart linter config |
| `mobile/.env.example` | Environment template |
| `mobile/flutter_launcher_icons.yaml` | App icon config |
| `mobile/flutter_native_splash.yaml` | Splash screen config |
| `mobile/l10n.yaml` | Localization config |
| `mobile/.metadata` | Flutter metadata |

### Entry Points

| Path | Purpose |
|------|---------|
| `mobile/lib/main.dart` | App entry: env init → MaterialApp |
| `mobile/lib/src/app.dart` | MaterialApp: theme, routes, locale |

### Modules

| Path | Purpose |
|------|---------|
| `mobile/lib/src/modules/login/controllers/` | Login controller |
| `mobile/lib/src/modules/login/views/` | Login screen |
| `mobile/lib/src/modules/home/controllers/` | Home controller |
| `mobile/lib/src/modules/home/views/` | Home screen |
| `mobile/lib/src/modules/home/widgets/` | Home widgets |

### Services

| Path | Purpose |
|------|---------|
| `mobile/lib/src/services/api/auth/` | Auth API calls |
| `mobile/lib/src/services/api/movimentacao/` | Movement API calls |
| `mobile/lib/src/services/http/http.dart` | HTTP client |
| `mobile/lib/src/services/http/api_exception.dart` | API exception |
| `mobile/lib/src/services/rfid/rfid.dart` | RFID reader service |
| `mobile/lib/src/services/scanner/scanner.dart` | Barcode scanner |
| `mobile/lib/src/services/zpl/zpl_print_service.dart` | ZPL printing |
| `mobile/lib/src/services/environment/env_manager.dart` | .env loader |
| `mobile/lib/src/services/log/log.dart` | Logging |
| `mobile/lib/src/services/settings/settings.dart` | Persistent settings |
| `mobile/lib/src/services/snackbar/snackbar.dart` | Toast notifications |

### Components

| Path | Purpose |
|------|---------|
| `mobile/lib/src/components/rfid_reader_panel/` | RFID reader panel (10 files) |
| `mobile/lib/src/components/dialogs/` | Dialogs (5 files) |
| `mobile/lib/src/components/tag_list/` | Tag list display |
| `mobile/lib/src/components/barcode_scan.dart` | Barcode scan button |
| `mobile/lib/src/components/collapsable_fab.dart` | Expandable FAB |
| `mobile/lib/src/components/text_scroll_wrapper.dart` | Auto-scroll text |

### Routing

| Path | Purpose |
|------|---------|
| `mobile/lib/src/routes/app_routes.dart` | Route name constants |
| `mobile/lib/src/routes/app_pages.dart` | Route bindings |

### Constants & Localization

| Path | Purpose |
|------|---------|
| `mobile/lib/src/constants/constants.dart` | App constants |
| `mobile/lib/src/constants/endpoints.dart` | API endpoints |
| `mobile/lib/src/constants/sizes.dart` | UI sizes |
| `mobile/lib/src/localization/` | Portuguese localization |

### Models

| Path | Purpose |
|------|---------|
| `mobile/lib/src/models/login_response.dart` | Auth response |
| `mobile/lib/src/models/movimentacao.dart` | Movement data |
| `mobile/lib/src/models/scanned_tag_item.dart` | Scanned tag |
| `mobile/lib/src/models/server_config.dart` | Server config |

---

## Infrastructure

| Path | Purpose |
|------|---------|
| `docker-compose-local.yml` | Local full stack |
| `docker-compose-development.yml` | Dev environment |
| `docker-compose-production.yml` | Production stack |
| `.env.example` | Root env template |
| `.agents/` | AI agent configurations |
| `.opencode/` | OpenCode AI tooling configuration |
| `graphify-out/` | Knowledge graph output |
