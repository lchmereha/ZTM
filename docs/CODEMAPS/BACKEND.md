# Backend Codemap

**Last Updated:** 2026-06-19
**Framework:** NestJS v11 + TypeScript 6.0
**Entry Point:** `src/main.ts`

---

## Module Architecture

```
backend/src/
├── main.ts                          # Bootstrap: NestFactory, middleware, Swagger, CORS
├── app.module.ts                    # Root module, global guards/filters/interceptors
├── app.controller.ts                # Health check / root endpoint
├── app.service.ts                   # App-level service
│
├── prisma/                          # Database access layer
├── common/                          # Shared utilities
├── auth/                            # Authentication & authorization
├── api-key/                         # External API key management
├── categoria/                       # Product categories
├── dashboard/                       # Dashboard KPIs
├── empresa/                         # Companies
├── equipamento/                     # RFID equipment
├── filial/                          # Branches/warehouses
├── integracao/                      # External integration API
├── modelo-etiqueta/                 # Label/ZPL templates
├── movimentacao/                    # Inventory movements (core domain)
├── permissao/                       # User permissions
├── posicao-estoque/                 # Stock positions
├── produto/                         # Products
├── relatorio/                       # Reports
├── tag-rfid/                        # RFID tags
├── tipo-movimentacao/               # Movement types
└── usuario/                         # Users
```

---

## Common Module (`src/common/`)

**Purpose:** Shared infrastructure used across all feature modules

```
common/
├── common.module.ts            # Shared module declaration
├── dto/
│   └── datatables.dto.ts       # Generic DataTables request DTO
├── filters/
│   └── database-exception.filter.ts  # Prisma errors → user-friendly messages
├── helpers/
│   ├── datatables.helper.ts    # DataTables query builder (skip, take, orderBy)
│   └── normalize.helper.ts     # Recursive snake_case ↔ camelCase conversion
├── interceptors/
│   ├── normalize.interceptor.ts  # Response transformation (entity → DTO format)
│   └── sliding-token.interceptor.ts  # Auto-refresh JWT on mutating requests
├── interfaces/
│   └── authenticated-request.interface.ts  # Extended Request with user payload
└── services/
    └── tenant.service.ts       # Tenant (filial) context resolution
```

**Key Patterns:**
- `NormalizeInterceptor` converts Prisma's snake_case fields to camelCase in responses
- `SlidingTokenInterceptor` extends JWT expiration on POST/PUT/PATCH/DELETE
- `DatabaseExceptionFilter` catches Prisma errors and returns structured error responses
- `DatatablesHelper` provides pagination/sorting/filtering for jQuery DataTables integration

---

## Auth Module (`src/auth/`)

**Purpose:** Authentication, authorization, and security

```
auth/
├── auth.module.ts
├── auth.controller.ts          # POST /auth/login, POST /auth/refresh
├── auth.service.ts             # Login logic, JWT generation, password hashing
├── strategies/
│   └── jwt.strategy.ts         # Passport JWT strategy (cookie + bearer)
├── guards/
│   ├── jwt-auth.guard.ts       # Default guard for all routes
│   ├── roles.guard.ts          # RBAC enforcement (@Roles decorator)
│   └── api-key.guard.ts        # API key validation (x-api-key header)
├── decorators/
│   ├── public.decorator.ts     # @Public() — bypass JWT auth
│   └── roles.decorator.ts      # @Roles('ADMIN') — require role
├── dto/                        # Login/refresh DTOs
└── entities/                   # Auth entity definitions
```

**Endpoints:**
- `POST /auth/login` — Authenticate user, issue JWT + set httpOnly cookie
- `POST /auth/refresh` — Refresh token (sliding expiration)

**Auth Flow:**
1. Default: ALL routes require JWT authentication (global `JwtAuthGuard`)
2. Use `@Public()` decorator to expose endpoints (login, health)
3. Use `@Roles('ADMIN')` to restrict to specific roles
4. API keys checked via `@UseGuards(ApiKeyGuard)` in integration module

---

## Movement Module (`src/movimentacao/`)

**Purpose:** Core domain — manages RFID inventory movements (associação, conferência, transferência, leitura)

```
movimentacao/
├── movimentacao.module.ts
├── movimentacao.controller.ts    # CRUD: GET, POST, PATCH, DELETE /movimentacao
├── movimentacao.service.ts       # Business logic for movements
├── batch-adapter.controller.ts   # Batch endpoints for mobile app
├── dto/                          # DTOs for each operation type
├── entities/                     # Movement entity definitions
└── services/
    ├── associacao.service.ts     # Association logic (tag → product)
    ├── base-movimentacao.service.ts  # Base class for common movement logic
    ├── batch-adapter.service.ts  # In-memory batch accumulator (tag buffer)
    ├── conferencia.service.ts    # Inventory conferencing logic
    ├── importacao.service.ts     # CSV/Excel import processing
    ├── leitura.service.ts        # RFID read processing
    ├── tag-processing.service.ts # Tag state transitions
    ├── transferencia.service.ts  # Inter-warehouse transfers
    └── zpl-print.service.ts     # ZPL label printing
```

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/movimentacao` | List movements (DataTables) |
| GET | `/movimentacao/:id` | Get movement details |
| POST | `/movimentacao` | Create movement |
| PATCH | `/movimentacao/:id` | Update movement |
| POST | `/movimentacao/:id/associacao/lotes` | Batch add tags to association |
| POST | `/movimentacao/:id/associacao/concluir-lotes` | Finalize batch association |
| POST | `/movimentacao/:id/conferencia/lotes` | Batch add to conference |
| POST | `/movimentacao/:id/conferencia/concluir-lotes` | Finalize batch conference |
| POST | `/movimentacao/:id/transferencia/lotes` | Batch add to transfer |
| POST | `/movimentacao/:id/transferencia/concluir-lotes` | Finalize batch transfer |
| POST | `/movimentacao/:id/leitura/lotes` | Batch add RFID reads |
| POST | `/movimentacao/:id/leitura/concluir-lotes` | Finalize batch reads |
| DELETE | `/movimentacao/:id/lotes` | Clear batch cache |

---

## Integration Module (`src/integracao/`)

**Purpose:** External API for third-party system integration

```
integracao/
├── integracao.module.ts
├── integracao.controller.ts   # External endpoints
├── integracao.service.ts      # Logic for external data exchange
└── dto/                       # Integration-specific DTOs
```

- Protected by `ApiKeyGuard` — validates `x-api-key` header
- Exposed in Swagger docs at `/docs`
- Designed for external system integration (ERP, WMS, etc.)

---

## Feature Modules (CRUD Pattern)

All CRUD modules follow the same NestJS pattern:

```
module-name/
├── module-name.module.ts       # Module declaration
├── module-name.controller.ts   # REST endpoints
├── module-name.service.ts      # Business logic
├── dto/                        # Create/Update DTOs (class-validator)
└── entities/                    # Entity definitions
```

| Module | Entity | Key Endpoints |
|--------|--------|---------------|
| `empresa` | Empresa (Company) | CRUD + logo upload |
| `filial` | Filial (Branch) | CRUD + CEP lookup via external API |
| `filial/cep.controller.ts` | — | `GET /filial/cep/:cep` |
| `equipamento` | Equipamento (Equipment) | CRUD for RFID readers/printers |
| `produto` | Produto (Product) | CRUD + DataTables |
| `categoria` | Categoria (Category) | CRUD |
| `tag-rfid` | TagRfid (RFID Tag) | CRUD + filtering |
| `usuario` | Usuario (User) | CRUD + password management |
| `permissao` | Permissao (Permission) | CRUD permissões por usuário |
| `modelo-etiqueta` | ModeloEtiqueta (Label Template) | CRUD + ZPL template storage |
| `tipo-movimentacao` | TipoMovimentacao (Movement Type) | CRUD |
| `posicao-estoque` | PosicaoEstoque (Stock Position) | CRUD |
| `api-key` | ApiKey | CRUD + key generation |
| `dashboard` | — | Aggregated KPI data |
| `relatorio` | — | Report generation |

---

## Prisma Module (`src/prisma/`)

**Purpose:** Database connection and access layer

```
prisma/
├── prisma.module.ts    # Global module exporting PrismaService
└── prisma.service.ts   # Singleton Prisma client, extends PrismaClient
```

- Generated client output: `src/generated/prisma/`
- Uses MySQL provider with MariaDB adapter
- Handles connection lifecycle, shutdown hooks

---

## Global Middleware & Pipeline

### Request Pipeline (top to bottom):
1. **Helmet** — Security HTTP headers
2. **Cookie Parser** — Parse cookies for JWT
3. **CORS** — Cross-origin resource sharing (env-driven)
4. **ValidationPipe** — DTO validation (`transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`)
5. **NormalizeInterceptor** — Response normalization (snake_case → camelCase)
6. **JwtAuthGuard** — JWT verification (global, opt-out via `@Public()`)
7. **RolesGuard** — Role-based access control
8. **ThrottlerGuard** — Rate limiting (60 req/min)
9. **DatabaseExceptionFilter** — Prisma error handling
10. **SlidingTokenInterceptor** — JWT refresh on mutating requests

---

## Database Connection

```typescript
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- Database URL from `DATABASE_URL` env var
- Uses `@prisma/adapter-mariadb` for MySQL/MariaDB compatibility
- Seed: `ts-node prisma/seed.ts`
- Migrations: `prisma/migrations/`
