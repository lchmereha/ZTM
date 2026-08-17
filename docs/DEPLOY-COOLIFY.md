# Deploy no Coolify (VM Oracle)

Guia do deploy de produção via **Coolify**, usando
`docker-compose-coolify.yml`. A variante AWS
(`docker-compose-production.yml`, Traefik próprio + Let's Encrypt) segue
válida como caminho alternativo — não é substituída por este documento.

---

## Como o Coolify enxerga um compose

Entender estes quatro pontos evita a maior parte dos deploys quebrados:

1. **O proxy é dele.** O Coolify já roda um Traefik (ou Caddy) ocupando as
   portas 80 e 443 do host, e gera os labels de roteamento a partir do
   domínio que você configura na UI. Um serviço Traefik dentro do seu compose
   colide nas portas e o deploy falha.
2. **A rede é dele.** Cada stack recebe uma bridge isolada, à qual o proxy é
   conectado. Rede declarada à mão na compose deixa o Traefik inalcançável e
   produz 504 intermitente. Dentro da stack, os serviços se resolvem pelo
   nome (`db`, `backend`) normalmente.
3. **As variáveis vêm da UI, não de arquivos.** O Coolify monta um único
   `.env` com todas as variáveis da aplicação e o anexa como `env_file` a
   **todos** os containers da stack. `${VAR}` no compose é interpolado com
   esses valores. `env_file: ./backend/.env.production` não funciona — o
   arquivo é gitignored e não existe no clone que o Coolify faz.
4. **Build e runtime são fases distintas.** Cada variável tem os flags *Build*
   e *Runtime* independentes. Variável de build vira `--build-arg`/`ARG`;
   variável de runtime só chega ao container. Isso importa para o frontend:
   tudo que o Vite injeta (`VITE_*`) é congelado no bundle em tempo de build.

---

## Topologia: um domínio só

Só o **frontend** recebe domínio. A API é servida pelo mesmo host em
`/ztm/api`, pelo proxy reverso do nginx do frontend (`nginx.conf.template`).

```
internet ──▶ Traefik do Coolify ──▶ nginx (frontend :8080) ──┬─▶ SPA em /ztm/
                 TLS                                          └─▶ backend:3000
                                                                  via /ztm/api/
                                                    backend ──▶ db:3306 (MySQL)
```

Consequências, todas desejáveis:

- Uma entrada DNS e um certificado, em vez de dois.
- Sem CORS: app e API na mesma origem.
- `COOKIE_SAMESITE=lax` em vez de `none` (a variante AWS precisa de `none`
  porque lá app e API ficam em domínios registráveis distintos).
- `TRUSTED_PROXY_HOPS=2`, porque agora há **dois** proxies à frente da API.

O app mobile funciona nessa topologia: a tela de configurações aceita
protocolo, host, porta e *endpoint*. Configure `https` / `<seu-domínio>` /
porta vazia / `/ztm/api`.

---

## Passo a passo na UI

### 1. Criar o recurso

`+ New` → **Application** → o repositório Git do projeto → build pack
**Docker Compose**.

| Campo | Valor |
|---|---|
| Base Directory | `/` |
| Docker Compose Location | `/docker-compose-coolify.yml` |
| Branch | `main` |

A extensão precisa bater exatamente, senão o Coolify não carrega o arquivo.
Ao salvar, ele faz o parse e cria automaticamente as entradas de variável
para cada `${VAR}` encontrado.

### 2. Preencher as variáveis

Aba **Environment Variables** → **Developer view** → cole o bloco abaixo,
substituindo os valores. Deixe todas como **Build + Runtime** (o padrão).

```env
# ── Domínio ──────────────────────────────────────────────────────
# Sem https:// e sem barra final. Compõe o ALLOWED_ORIGINS do backend.
APP_DOMAIN=app.seudominio.com.br

# ── MySQL (serviço `db` da stack) ────────────────────────────────
DB_NAME=rfid_db
DB_USER=ztm_app
DB_PASS=troque-esta-senha
DB_ROOT_PASS=troque-esta-senha-root

# ── Backend ──────────────────────────────────────────────────────
# Precisa repetir usuário/senha/banco do bloco acima, e o host é `db`.
# ATENÇÃO: percent-encode os caracteres especiais da senha — `@` → %40,
# `:` → %3A, `/` → %2F. Sem isso o parser do Prisma quebra a URL.
DATABASE_URL=mysql://ztm_app:troque-esta-senha@db:3306/rfid_db

# `migrate deploy` não usa shadow database, mas o prisma.config.ts resolve
# env('SHADOW_DATABASE_URL') na carga e falha se ela não existir.
SHADOW_DATABASE_URL=mysql://root:troque-esta-senha-root@db:3306/prisma_shadow

# Gere um novo: `openssl rand -hex 32`. NÃO reaproveite o do repositório.
JWT_SECRET=
JWT_EXPIRES_IN=1d

# Primeiro acesso ao sistema, criado pelo seed.
ADMIN_USERNAME=ZZADMIN
ADMIN_PASSWORD=

# ── População de demonstração (só no ambiente de review) ─────────
SEED_DEMO=false
DEMO_USERNAME=
DEMO_PASSWORD=
```

Não precisa declarar `NODE_ENV`, `PORT`, `COOKIE_SECURE`, `COOKIE_SAMESITE`,
`TRUSTED_PROXY_HOPS` nem `ALLOWED_ORIGINS`: o compose já os fixa, porque são
propriedades da topologia e não configuração de instalação.

### 3. Configurar o domínio do frontend

O compose declara `SERVICE_FQDN_FRONTEND_8080` no serviço `frontend`. Depois
do primeiro parse, o Coolify expõe esse domínio para edição (na aba de
domínios do serviço, ou como variável). Preencha com
`https://app.seudominio.com.br` — o mesmo valor de `APP_DOMAIN`, agora com
esquema.

O `db` e o `backend` não recebem domínio de propósito: ficam apenas na rede
interna da stack.

### 4. Antes do primeiro deploy

- Registro DNS **A** de `APP_DOMAIN` apontando para o IP público da VM. O
  Let's Encrypt valida por ele; sem DNS propagado não há certificado.
- Portas 80 e 443 liberadas nos dois lugares: **Security List / NSG** da VCN
  na console da Oracle **e** no firewall da própria VM. Imagens Oracle Linux e
  Ubuntu da OCI vêm com regras `iptables` que descartam tudo fora do 22 —
  liberar só na console não basta.

### 5. Deploy

`Deploy`. A ordem esperada nos logs:

1. `db` sobe e fica *healthy*.
2. `backend-migrate` roda `prisma migrate deploy` + seed e **sai com código
   0**. Terminar é o comportamento correto: por isso o serviço tem
   `exclude_from_hc: true`, senão o Coolify marcaria a stack como unhealthy.
3. `backend` sobe e fica *healthy*.
4. `frontend` sobe; o Traefik do Coolify emite o certificado.

### 6. Validar

```bash
# Deve redirecionar para /ztm/ e servir o SPA
curl -IL https://app.seudominio.com.br

# API através do proxy do nginx
curl -i https://app.seudominio.com.br/ztm/api/auth/login

# Política de privacidade da Play Store — valide de fora da rede da empresa
curl -I https://app.seudominio.com.br/ztm/mobile
```

---

## Operação

**Trocar o backend do frontend, a versão exibida ou o base path** exige
**rebuild**, não redeploy: esses valores vêm de `frontend/.env.coolify` e são
embutidos no bundle pelo Vite em tempo de build. Edite o arquivo, commit,
e faça deploy com cache limpo se necessário.

**As migrations rodam a cada deploy**, no `backend-migrate`. O seed é
idempotente para o admin; conferir isso antes de habilitar `SEED_DEMO`.

**Backup do banco.** O `db_data` é um volume Docker gerenciado pelo Coolify.
Um volume vive na VM: snapshot da instância na OCI não é backup de banco.
Configure `mysqldump` agendado antes de haver dado real em produção.

**Se entrar Cloudflare (proxy laranja) na frente**, passe
`TRUSTED_PROXY_HOPS` para `3` no compose — o valor errado para baixo faz o
`ThrottlerGuard` tratar a planta inteira como um cliente só e devolver 429
indevido a 60 req/min; para cima, permite forjar `X-Forwarded-For` e furar o
limite.

---

## Pendências conhecidas

- `frontend/.env.production` está sendo ignorado pelo `.gitignore` da raiz
  (linha `.env.production`, que casa em qualquer nível), contrariando o que o
  `frontend/.gitignore` documenta. Isso não afeta este deploy — que usa
  `.env.coolify` — mas **quebra o build da variante AWS em um clone novo**,
  silenciosamente: sem o arquivo, o Vite compila sem `VITE_BACKEND_URL` e sem
  `VITE_APP_BASE_NAME`. Corrigir com uma negação (`!.env.production` em
  `frontend/.gitignore`).
- `JWT_SECRET`, `ADMIN_PASSWORD` e `DEMO_PASSWORD` do repositório devem ser
  considerados comprometidos e rotacionados neste deploy.
