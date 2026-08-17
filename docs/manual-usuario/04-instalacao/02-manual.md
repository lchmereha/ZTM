# 04/02 — Setup Manual (Sem Docker)

## Pré-requisitos

- Node.js 20+
- MySQL 9.7
- NPM 10+
- Git

## Backend

### 1. Configurar Banco de Dados

Crie o banco de dados MySQL:

```sql
CREATE DATABASE ztm_db;
CREATE USER 'ztm_app'@'localhost' IDENTIFIED BY 'MinhaSenhaApp@123';
GRANT ALL PRIVILEGES ON ztm_db.* TO 'ztm_app'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configurar Variáveis de Ambiente

```bash
cd backend
cp .env.example .env.local
```

Edite `.env.local`:
```env
DATABASE_URL="mysql://ztm_app:MinhaSenhaApp@123@localhost:3306/ztm_db"
JWT_SECRET=sua-chave-secreta-com-pelo-menos-32-caracteres
JWT_EXPIRES_IN=1d
PORT=3000
ADMIN_USERNAME=ADMIN
ADMIN_PASSWORD=Admin@123456
ALLOWED_ORIGINS=http://localhost:5173
NODE_ENV=development
COOKIE_SECURE=false
CEP_API_URL=https://viacep.com.br/ws
```

### 3. Instalar Dependências e Rodar Migrations

```bash
npm install
npx prisma migrate dev
npx prisma db seed
```

### 4. Iniciar o Servidor

```bash
npm run start:dev
```

O backend estará disponível em `http://localhost:3000`.

---

## Frontend

### 1. Configurar Variáveis de Ambiente

```bash
cd frontend
cp .env.example .env.local
```

Edite `.env.local`:
```env
VITE_APP_VERSION=v1.0.0
VITE_APP_BASE_NAME=/
VITE_BACKEND_URL=http://localhost:3000
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

---

## Verificando a Instalação

1. Acesse `http://localhost:5173`
2. Faça login com:
   - **Usuário:** `ADMIN`
   - **Senha:** `Admin@123456`
3. Selecione a filial padrão
4. O dashboard deve carregar com os indicadores

<!-- SCREENSHOT: navegador-login-sucesso -->

---
