# ZTM — Codemap Index

**Last Updated:** 2026-06-19
**Project:** ZZTech Trace Module (ZTM)
**Description:** RFID-based inventory tracking and movement management system with web dashboard, mobile app, and external integration API.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React/TS)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Dashboard│ │Configura-│ │ Produtos │ │ Movimen-  │  │
│  │          │ │ ções     │ │          │ │ tações    │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│         │           │            │            │          │
│         └───────────┴────────────┴────────────┘          │
│                         │ REST API (Axios)               │
├─────────────────────────┼─────────────────────────────────┤
│                 Backend (NestJS/TS)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Auth      │ │ CRUD     │ │Movimen- │ │ Relatórios│  │
│  │Module    │ │ Modules  │ │tação    │ │           │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│                         │                               │
│              ┌──────────┴──────────┐                    │
│              │   Prisma ORM        │                    │
│              └──────────┬──────────┘                    │
├─────────────────────────┼─────────────────────────────────┤
│                 Database (MySQL 9.x)                      │
├───────────────────────────────────────────────────────────┤
│ Mobile (Flutter)  ◄──── WebSocket/REST ────► External API │
│                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ RFID     │ │ Barcode  │ │ ZPL Print│              │
│  │ Reader   │ │ Scanner  │ │          │              │
│  └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## Codemaps

| # | Codemap | Description |
|---|---------|-------------|
| 1 | [ARCHITECTURE.md](./ARCHITECTURE.md) | High-level system architecture & data flow |
| 2 | [BACKEND.md](./BACKEND.md) | NestJS backend modules, controllers, services |
| 3 | [FRONTEND.md](./FRONTEND.md) | React frontend pages, components, contexts |
| 4 | [DATABASE.md](./DATABASE.md) | Prisma schema, models, relationships |
| 5 | [MOBILE.md](./MOBILE.md) | Flutter mobile app structure |
| 6 | [MODULES.md](./MODULES.md) | Module descriptions, APIs, dependencies |
| 7 | [FILES.md](./FILES.md) | Complete directory structure & file purposes |

---

## Technology Stack

### Frontend (`frontend/`)
- **Framework:** React 19 + TypeScript 5.9
- **Build:** Vite 8 + rolldown
- **UI:** MUI v9 (Material UI), Emotion, Tabler Icons
- **State:** React Context, SWR for data fetching
- **Forms:** Formik + Yup validation
- **Charts:** ApexCharts
- **Routing:** React Router v7
- **Tables:** DataTables.net, MUI X-DataGrid
- **HTTP:** Axios with interceptors
- **Animation:** Framer Motion

### Backend (`backend/`)
- **Framework:** NestJS v11 + TypeScript 6.0
- **ORM:** Prisma 7 (MySQL adapter)
- **Database:** MySQL 9.x (MariaDB compatible)
- **Auth:** JWT + Passport, API Key, Role-based guards
- **Validation:** class-validator + class-transformer
- **API Docs:** Swagger/OpenAPI (integration endpoints)
- **Security:** Helmet, CORS, Throttling
- **Container:** Docker multi-stage builds

### Mobile (`mobile/`)
- **Framework:** Flutter (Dart SDK 3.12)
- **State:** GetX (Get) + GetStorage
- **Networking:** HTTP package
- **Hardware:** Custom packages for RFID reader & barcode scanner
- **BLE:** flutter_blue_plus
- **Printing:** ZPL over network sockets
- **Localization:** Flutter intl + ARB files

### Infrastructure
- **Docker Compose:** local, development, production profiles
- **Nginx:** Frontend reverse proxy (production)
- **Database:** MySQL 9.7 with health checks

---

## Key Flows

### RFID Movement Flow
```
Mobile App (RFID Reader) ──WebSocket──► Backend ──► Database
       │                                           ▲
       │  REST (batches)                           │
       └───────────────────────────────────────────┘
```

### Web Dashboard Flow
```
Browser ──HTTP──► Nginx ──► Frontend (Vite/SPA)
                          │
                     Axios API calls
                          │
                          ▼
                    Backend (NestJS)
                          │
                     Prisma ORM
                          │
                          ▼
                    MySQL Database
```

### External Integration Flow
```
Third-party System ──REST (API Key)──► Backend Integration Module
                                              │
                                         Prisma ORM
                                              │
                                              ▼
                                         MySQL Database
```

---

**Related:** [README.md](../../README.md) | [Backend README](../../backend/README.md) | [Frontend README](../../frontend/README.md) | [Manual do Usuário](../../docs/manual-usuario/README.md)
