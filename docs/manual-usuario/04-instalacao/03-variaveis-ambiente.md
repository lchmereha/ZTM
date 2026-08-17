# 04/03 — Variáveis de Ambiente

## Arquivo `.env` (Raiz — Docker Compose)

| Variável | Obrigatório | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `DB_NAME` | Sim | Nome do banco de dados | `ztm_db` |
| `DB_ROOT_PASS` | Sim | Senha do usuário root MySQL | `MinhaSenhaRoot@123` |
| `DB_USER` | Sim | Usuário da aplicação MySQL | `ztm_app` |
| `DB_PASS` | Sim | Senha do usuário da aplicação | `MinhaSenhaApp@123` |

## Backend — `.env.local` / `.env.development` / `.env.production`

### Banco de Dados

| Variável | Obrigatório | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `DATABASE_URL` | Sim | URL de conexão MySQL | `mysql://ztm_app:senha@db:3306/ztm_db` |
| `SHADOW_DATABASE_URL` | Não | Shadow DB para migrations (dev) | `mysql://root:senha@localhost:3306/prisma_shadow` |

### Autenticação

| Variável | Obrigatório | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `JWT_SECRET` | Sim | Chave secreta para JWT (mín. 32 caracteres) | `minha-chave-super-secreta-com-32-chars` |
| `JWT_EXPIRES_IN` | Sim | Tempo de expiração do token | `1d` |

### Servidor

| Variável | Obrigatório | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `PORT` | Não | Porta do servidor (default: 3000) | `3000` |
| `NODE_ENV` | Sim | Ambiente de execução | `production`, `development` |
| `ALLOWED_ORIGINS` | Sim | Origens permitidas no CORS | `http://localhost:5173` ou `*` |
| `COOKIE_SECURE` | Sim | Cookie seguro (true apenas com HTTPS) | `false` |

### Admin Seed

| Variável | Obrigatório | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `ADMIN_USERNAME` | Sim | Usuário admin inicial | `ADMIN` |
| `ADMIN_PASSWORD` | Sim | Senha do admin inicial | `Admin@123456` |

### Serviços Externos

| Variável | Obrigatório | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `CEP_API_URL` | Não | URL da API de CEP (default: ViaCEP) | `https://viacep.com.br/ws` |

## Frontend — `.env.local` / `.env.development` / `.env.production`

| Variável | Obrigatório | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `VITE_APP_VERSION` | Sim | Versão exibida no frontend | `v1.0.0` |
| `VITE_APP_BASE_NAME` | Sim | Path base da aplicação | `/ztm` ou `/` |
| `VITE_BACKEND_URL` | Sim | URL do backend | `/api` ou `http://localhost:3000` |

> **Dica:** Em produção com Nginx proxy, `VITE_BACKEND_URL=/api` faz o frontend chamar o backend no mesmo domínio. Em desenvolvimento sem proxy, use a URL completa (`http://localhost:3000`).

## Mobile — `.env`

| Variável | Obrigatório | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `BUILD_MODE` | Sim | Modo de build | `PRODUCTION` |
| `SETTINGS_PASSWORD` | Sim | Senha para acessar configurações no app | `1234` |

<!-- SCREENSHOT: editor-env -->

---
