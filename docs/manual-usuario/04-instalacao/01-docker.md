# 04/01 — Setup com Docker Compose

## Pré-requisitos

- Docker Engine 24+ e Docker Compose V2
- Git (para clonar o repositório)
- 4 GB de RAM livre (recomendado)

## Passo a Passo

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio> ztm
cd ztm
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
DB_NAME=ztm_db
DB_ROOT_PASS=MinhaSenhaRoot@123
DB_USER=ztm_app
DB_PASS=MinhaSenhaApp@123
```

### 3. Configurar Backend

```bash
cp backend/.env.example backend/.env.local
```

Edite `backend/.env.local` com os valores adequados (veja [Variáveis de Ambiente](03-variaveis-ambiente.md)).

**Atenção:** A `DATABASE_URL` deve usar `db` como host (nome do serviço no Docker):
```
DATABASE_URL="mysql://ztm_app:MinhaSenhaApp@123@db:3306/ztm_db"
```

### 4. Configurar Frontend

```bash
cp frontend/.env.example frontend/.env.local
```

Edite `frontend/.env.local`:

```env
VITE_APP_VERSION=v1.0.0
VITE_APP_BASE_NAME=/ztm
VITE_BACKEND_URL=/api
```

### 5. Executar o Ambiente Local

```bash
docker compose -f docker-compose-local.yml up -d
```

Isso iniciará:
- **MySQL 9.7** na porta `3306`
- **Backend NestJS** na porta `3000`
- **Frontend React + Nginx** na porta `80`

**Acessar:** `http://localhost` ou `http://localhost/ztm/`

### 6. Executar as Migrations

```bash
docker compose -f docker-compose-local.yml exec backend npx prisma migrate deploy
```

### 7. Popular o Banco (Seed)

```bash
docker compose -f docker-compose-local.yml exec backend npx prisma db seed
```

Isso criará o usuário ADMIN padrão (configurado via variáveis de ambiente).

### 8. Verificar

```bash
docker compose -f docker-compose-local.yml ps
```

Todos os 3 serviços devem estar com status `Up`.

---

## Ambientes Disponíveis

### Local (Desenvolvimento)

```bash
docker compose -f docker-compose-local.yml up -d
```

- Build com `Dockerfile.production`
- Frontend na porta `80`
- Ideal para testes locais em produção simulada

### Desenvolvimento (Hot-Reload)

```bash
docker compose -f docker-compose-development.yml up -d
```

- Build com `Dockerfile.development`
- Frontend na porta `5173` (Vite dev server)
- Volumes montados para hot-reload
- Ideal para desenvolvimento

### Produção

⚠️ O ambiente de produção está em fase de implementação (WIP). Consulte a equipe de TI antes de utilizar em produção real.

---

## Comandos Úteis

```bash
# Ver logs
docker compose -f docker-compose-local.yml logs -f backend

# Acessar o banco
docker compose -f docker-compose-local.yml exec db mysql -u ztm_app -p ztm_db

# Parar serviços
docker compose -f docker-compose-local.yml down

# Reconstruir imagens
docker compose -f docker-compose-local.yml build --no-cache

# Executar comando no backend
docker compose -f docker-compose-local.yml exec backend npm run <comando>
```

<!-- SCREENSHOT: terminal-docker-up -->

---
