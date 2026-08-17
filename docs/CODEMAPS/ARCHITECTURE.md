# Architecture Codemap

**Last Updated:** 2026-06-19
**Project:** ZTM (ZZTech Trace Module)

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                      │
│  ┌─────────────────────┐    ┌───────────────────────────────────┐   │
│  │   Web Browser (SPA) │    │   Mobile App (Flutter)            │   │
│  │                     │    │                                   │   │
│  │  React 19 + MUI v9  │    │  Dart 3.12 + GetX                │   │
│  │  Vite 8 + TypeScript│    │  RFID Reader + Barcode Scanner    │   │
│  └──────────┬──────────┘    └──────────────┬────────────────────┘   │
│             │                              │                         │
│             │ HTTP REST                    │ HTTP REST + WebSocket   │
└─────────────┼──────────────────────────────┼─────────────────────────┘
              │                              │
┌─────────────┼──────────────────────────────┼─────────────────────────┐
│             │         GATEWAY LAYER        │                         │
│             ▼                              ▼                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Nginx Reverse Proxy (Production)                 │   │
│  │  Static file serving + API route passthrough to backend      │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────┐
│                    API LAYER (NestJS 11)                            │
│                             │                                       │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │                    Global Middleware                          │   │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────┐  │   │
│  │  │ Helmet  │ │  CORS    │ │  Cookie   │ │ ValidationPipe│  │   │
│  │  │ (HTTP   │ │ (env     │ │  Parser   │ │ (class-vali-  │  │   │
│  │  │security)│ │ driven)  │ │           │ │  dator)       │  │   │
│  │  └─────────┘ └──────────┘ └───────────┘ └───────────────┘  │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│                            │                                        │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │              Global Guards & Interceptors                    │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │   │
│  │  │ JwtAuthGuard  │ │ RolesGuard   │ │ SlidingToken     │    │   │
│  │  │ (default all) │ │ (RBAC)       │ │ Interceptor      │    │   │
│  │  ├──────────────┤ ├──────────────┤ ├──────────────────┤    │   │
│  │  │ ThrottlerGuard│ │ DbException  │ │ Normalize        │    │   │
│  │  │ (60 req/min) │ │ Filter       │ │ Interceptor      │    │   │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘    │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│                            │                                        │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │                    Feature Modules                            │   │
│  │                                                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │ Auth     │  │ Empresa  │  │ Produto  │  │Movimenta-│    │   │
│  │  │          │  │          │  │          │  │ ção      │    │   │
│  │  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤    │   │
│  │  │ Usuario  │  │ Filial   │  │ Categoria│  │ Tag RFID │    │   │
│  │  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤    │   │
│  │  │ Permissão│  │Equipamen-│  │Tipo Movi-│  │Dashboard │    │   │
│  │  │          │  │ to       │  │ mentação │  │          │    │   │
│  │  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤    │   │
│  │  │Pos.Estoq │  │Mod.Etiqu.│  │ Relatório│  │Integração│    │   │
│  │  │          │  │          │  │          │  │ (API Key)│    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│                            │                                        │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │  PrismaService (Singleton - Database Access Layer)   │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│                            │                                        │
└────────────────────────────┼────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────┐
│                   DATA LAYER (MySQL 9.x)                            │
│                             ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     ztm_database                              │  │
│  │                                                               │  │
│  │  empresas ──┬── filiais ──┬── equipamentos                    │  │
│  │             │             ├── tags_rfid                       │  │
│  │             │             ├── movimentacoes                   │  │
│  │             │             ├── posicoes_estoque                │  │
│  │             │             └── api_keys                        │  │
│  │             │                                                 │  │
│  │             ├── categorias ──── produtos ──── tags_rfid       │  │
│  │             ├── modelos_etiqueta                              │  │
│  │             └── tipos_movimentacao                            │  │
│  │                                                               │  │
│  │  usuarios ───┬── usuarios_filiais (N:N)                       │  │
│  │              └── permissoes_usuario (N:N)                     │  │
│  │                                                               │  │
│  │  opcoes_menu ─── permissoes_usuario                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Patterns

### Read Operation (e.g., Listing Products)
```
1. Browser → GET /produto/datatables
2. Nginx → Backend (NestJS)
3. JwtAuthGuard → validates JWT from httpOnly cookie
4. RolesGuard → checks user permissions
5. ProdutoController → ProdutoService
6. ProdutoService → PrismaService → MySQL
7. Response ← NormalizeInterceptor transforms output
8. Frontend SWR cache updates UI
```

### Write Operation (e.g., Creating Movement)
```
1. Browser → POST /movimentacao
2. ValidationPipe (DTO validation) → forbidNonWhitelisted
3. MovimentacaoController → MovimentacaoService
4. Prisma transaction → creates movimentacao + itens
5. DatabaseExceptionFilter catches Prisma errors
6. SlidingTokenInterceptor refreshes JWT on write
7. Response ← NormalizeInterceptor (snake_case → camelCase)
```

### Batch RFID Operation (Mobile App)
```
1. Flutter Mobile → RFID Reader reads tags
2. Tags stored in local buffer (batch adapter)
3. POST /movimentacao/:id/associacao/lotes (batches)
4. POST /movimentacao/:id/associacao/concluir-lotes (flush)
5. BatchAdapterService accumulates → MovimentacaoService processes
6. Response with processed tags
```

### External Integration API
```
1. Third-party → GET /api/integracao (with x-api-key header)
2. ApiKeyGuard validates API key → resolves to Filial
3. IntegracaoController → IntegracaoService
4. Response with external-format data
5. Swagger docs at /docs
```

---

## Security Architecture

```
┌──────────────────────────────────────────────┐
│           Security Layers                     │
│                                              │
│  Layer 1: Helmet (HTTP headers)              │
│  Layer 2: CORS (origin whitelist)            │
│  Layer 3: Rate Limiting (60 req/min)         │
│  Layer 4: JWT Auth (httpOnly cookie)         │
│  Layer 5: Role-based Access Control (RBAC)   │
│  Layer 6: API Key Auth (external systems)    │
│  Layer 7: Input Validation (class-validator) │
│  Layer 8: Database Exception Filter          │
└──────────────────────────────────────────────┘
```

### Authentication Methods

| Method | Audience | Implementation |
|--------|----------|---------------|
| JWT Cookie | Web dashboard users | `passport-jwt` strategy, httpOnly cookie |
| JWT Bearer | Mobile app | Same JWT, passed via Authorization header |
| API Key | External integrations | `x-api-key` header, mapped to Filial |
| Public endpoints | Login, health check | `@Public()` decorator bypasses JWT guard |

---

## Error Handling

```
┌──────────────────────────────┐
│    Error Response Schema     │
│                              │
│  {                           │
│    "statusCode": 400,        │
│    "error": "Bad Request",   │
│    "message": "string",      │
│    "detalhes": [             │
│      {                       │
│        "campo": "nome",      │
│        "erros": ["..."]      │
│      }                       │
│    ]                         │
│  }                           │
└──────────────────────────────┘
```

- **Validation Errors:** `BadRequestException` with structured `detalhes` array
- **Database Errors:** Caught by `DatabaseExceptionFilter`, mapped to user-friendly messages
- **Auth Errors:** 401 returns immediately, frontend redirects to session-expired
- **Business Errors:** Domain-specific exceptions with Portuguese messages

---

## Deployment Architecture

### Docker Compose Profiles

**Local (`docker-compose-local.yml`):**
- MySQL 9.7 + Backend (production build) + Frontend (production build with nginx)
- `.env.local` files for each service

**Development (`docker-compose-development.yml`):**
- MySQL 9.7 + Backend (watch mode, volume-mounted)
- Frontend runs externally via `yarn start`

**Production (`docker-compose-production.yml`):**
- MySQL 9.7 + Backend (production) + Frontend (production, nginx)
- `.env.production` files

### Container Structure
```
frontend/
  Dockerfile.production  → nginx:alpine serving built SPA
  nginx.conf             → reverse proxy /api → backend:3000

backend/
  Dockerfile.production  → node:alpine running NestJS
  Dockerfile.development → node:alpine with nodemon watch
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| NestJS with modular architecture | Clear separation by domain, easy to add new CRUD modules |
| JWT in httpOnly cookie | Prevents XSS token theft, automatic CSRF protection |
| SWR for data fetching | Stale-while-revalidate pattern reduces API calls, optimistic UI |
| Batch adapter pattern | Handles large RFID scans without blocking; client sends in chunks |
| Prisma over raw SQL | Type-safe queries, auto-generated types, migration management |
| Portuguese in codebase | Domain language, matches client requirements |
| MUI v9 | Mature component library, theming system, accessibility |
| GetX in Flutter | Lightweight state management, DI, and routing |
