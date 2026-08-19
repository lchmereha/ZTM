# Deploy no Coolify (VM Oracle)

Guia do deploy de produção via **Coolify**, usando `docker-compose-coolify.yml`.
A variante AWS (`docker-compose-production.yml`, Traefik próprio + Let's
Encrypt) segue válida como caminho alternativo — não é substituída por este
documento.

---

## Como o Coolify enxerga um compose

Entender estes quatro pontos evita a maior parte dos deploys quebrados:

1. **O proxy é dele.** O Coolify já roda um Traefik (ou Caddy) ocupando as
   portas 80 e 443 do host, e gera os labels de roteamento a partir do domínio
   que você configura na UI. Um serviço Traefik dentro do seu compose colide nas
   portas e o deploy falha.
2. **A rede é dele.** Cada stack recebe uma bridge isolada, à qual o proxy é
   conectado. Rede declarada à mão na compose deixa o Traefik inalcançável e
   produz 504 intermitente. Dentro da stack, os serviços se resolvem pelo nome
   (`db`, `backend`) normalmente.
3. **As variáveis vêm da UI, não de arquivos.** O Coolify monta um único `.env`
   com todas as variáveis da aplicação e o anexa como `env_file` a **todos** os
   containers da stack. `${VAR}` no compose é interpolado com esses valores.
   `env_file: ./backend/.env.production` não funciona — o arquivo é gitignored e
   não existe no clone que o Coolify faz.
4. **Build e runtime são fases distintas.** Cada variável tem os flags _Build_ e
   _Runtime_ independentes. Variável de build vira `--build-arg`/`ARG`; variável
   de runtime só chega ao container. Isso importa para o frontend: tudo que o
   Vite injeta (`VITE_*`) é congelado no bundle em tempo de build.

---

## Topologia: um domínio só

Só o **frontend** recebe domínio. A API é servida pelo mesmo host em `/ztm/api`,
pelo proxy reverso do nginx do frontend (`nginx.conf.template`).

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

O app mobile funciona nessa topologia: a tela de configurações aceita protocolo,
host, porta e _endpoint_. Configure `https` / `<seu-domínio>` / porta vazia /
`/ztm/api`.

---

## Passo a passo na UI

### 1. Criar o recurso

Referência: Coolify **v4** (rótulos conferidos na documentação da linha v4;
a linha 4.0.0-beta mudou de nome de campo várias vezes — se a sua instância
divergir, o conceito é o mesmo, só o rótulo muda).

1. Abra o **Project** e o **Environment** (`production`). Recurso no Coolify
   vive dentro de um projeto — não existe recurso solto.
2. **+ New** / _Create New Resource_.
3. Escolha o **tipo de fonte direto** — não há passo "Application"
   intermediário. As opções são: _Public Repository_, _Private Repository (with
   GitHub App)_, _Private Repository (with deploy key)_, _Dockerfile_, _Docker
   Compose_, _Docker Image_. Para este deploy: **Public Repository**.
4. Cole a URL: `https://github.com/lchmereha/ZTM`.
5. ⚠️ **Troque o Build Pack.** Ele vem como **Nixpacks** por padrão. Clique nele
   e escolha **Docker Compose** na lista. Esquecer este passo é o erro mais
   comum: o Nixpacks tenta adivinhar como buildar o projeto e ignora o compose.
6. Só depois de escolher Docker Compose aparecem os campos abaixo.

| Campo                   | Valor                         |
| ----------------------- | ----------------------------- |
| Branch                  | `main`                        |
| Base Directory          | `/`                           |
| Docker Compose Location | `/docker-compose-coolify.yml` |

A extensão precisa bater exatamente, senão o Coolify não carrega o arquivo. Ao
salvar, ele faz o parse e cria automaticamente as entradas de variável para cada
`${VAR}` encontrado.

⚠️ **Confira o Docker Compose Location.** Existe um `docker-compose.yml` na raiz
do repositório — cópia da variante AWS, com Traefik próprio, `networks:` e
`env_file`. É o nome que o Coolify tenta por padrão, e apontar para ele faz o
deploy falhar pelos três motivos da seção acima. O arquivo desta topologia é o
`docker-compose-coolify.yml`.

### 2. Preencher as variáveis

Aba **Environment Variables** → **Developer view**. Ao salvar o recurso, o
Coolify já criou uma entrada para cada `${VAR}` do compose e preencheu os
defaults declarados com `:-` (`DATABASE_POOL_SIZE`, `JWT_EXPIRES_IN`,
`SESSION_ABSOLUTE_TTL`, `CEP_API_URL`). Falta preencher as vazias.

Existem dois blocos: **Production** e **Preview deployments**. Use o
**Production** — o segundo só vale se você habilitar deploys de preview por pull
request, que não é o caso.

⚠️ **Preencha os valores vazios; não cole por cima do bloco todo.** As linhas
`SERVICE_FQDN_FRONTEND` e `SERVICE_URL_FRONTEND` são geradas pelo Coolify e
carregam o roteamento — substituir o conteúdo inteiro do textarea apaga as duas.
Comentários também são descartados no save (a própria tela avisa), então as
explicações abaixo vivem aqui no manual, não lá.

Deixe todas como **Build + Runtime** (o padrão).

```env
# ── Domínio ──────────────────────────────────────────────────────
# Sem https:// e sem barra final. Compõe o ALLOWED_ORIGINS do backend.
APP_DOMAIN=app.seudominio.com.br

# ── MySQL (serviço `db` da stack) ────────────────────────────────
# Credenciais do banco que a stack CRIA — não de um banco existente. O
# container oficial do MySQL lê estas variáveis e cria o banco e o usuário.
#
# ⚠️ Ele só faz isso no PRIMEIRO boot, com o volume `db_data` vazio. Corrigir
# uma destas variáveis depois não tem efeito: o entrypoint as ignora quando o
# diretório de dados já existe, e o backend fica em "Access denied" até o
# volume ser apagado. Confira os valores ANTES do primeiro deploy.
#
# ⚠️ Senha aqui é LITERAL, sem percent-encoding. Estas variáveis vão para o
# MySQL como variável de ambiente comum, não como URL. Escrever `Zz%401020`
# aqui cria o usuário com esse texto como senha, enquanto a DATABASE_URL
# decodifica para `Zz@1020` — resultado: "Access denied" permanente.
#
# Mais simples: use senha só com letras e números. Aí os dois campos ficam
# idênticos e não há como errar o lado.
DB_NAME=rfid_db
DB_USER=ztm_app
DB_PASS=troque-esta-senha
DB_ROOT_PASS=troque-esta-senha-root

# ── Backend ──────────────────────────────────────────────────────
# Repete usuário/senha/banco do bloco acima, com o host fixo `db`. Aqui, ao
# contrário do bloco acima, a senha vai percent-encoded — é uma URL.
#
# Verificado contra MySQL 9.7 + Prisma 6: `/`, `#`, `?` e `%` crus fazem a
# conexão falhar; `@` e `:` crus funcionam por acidente do parser. A forma
# encoded funciona em todos os casos, então encode sempre:
#   @ → %40   : → %3A   / → %2F   # → %23   ? → %3F   % → %25
DATABASE_URL=mysql://ztm_app:troque-esta-senha@db:3306/rfid_db

# `migrate deploy` não usa shadow database, mas o prisma.config.ts resolve
# env('SHADOW_DATABASE_URL') na carga e falha se ela não existir.
SHADOW_DATABASE_URL=mysql://root:troque-esta-senha-root@db:3306/prisma_shadow

# Gere um novo: `openssl rand -hex 32`. NÃO reaproveite o do repositório.
JWT_SECRET=

# Sessão: JWT_EXPIRES_IN é a vida de cada token e o interceptor deslizante
# renova a partir da metade dela (12h com 1d). SESSION_ABSOLUTE_TTL é o teto
# nominal contado do login original, onde a renovação para de propósito.
JWT_EXPIRES_IN=1d
SESSION_ABSOLUTE_TTL=30d

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

O domínio se define na aba **Domains** (menu lateral do recurso), não nas
variáveis. Ela lista um domínio por serviço do compose — aqui deve aparecer só o
`frontend`. Edite o domínio `sslip.io` auto-gerado e troque por
`https://app.seudominio.com.br`.

O modal de edição separa Protocol / Domain / Port / Path. Preencha:

| Campo    | Valor                                                          |
| -------- | -------------------------------------------------------------- |
| Protocol | `https`                                                        |
| Domain   | o domínio, sem esquema — ex.: `ztm.zztech.com.br`              |
| Port     | **`8080`** — porta interna do container, não a pública          |
| Path     | *(vazio)*                                                      |

⚠️ **O Port é a porta do container.** O Coolify preenche `443` sozinho quando
você escolhe `https`, deduzindo a porta padrão do protocolo — está errado. A
porta pública é sempre 443 e quem cuida dela é o Traefik; este campo diz ao proxy
para qual porta *interna* encaminhar. O frontend usa a imagem
`nginx-unprivileged`, que escuta em **8080** (`EXPOSE 8080`, `listen 8080`).
Deixando `443`, o Traefik encaminha para uma porta onde nada escuta e o resultado
é **502 Bad Gateway**.

⚠️ **O Path fica vazio.** Ver o aviso sobre `stripprefix` abaixo.

Três detalhes dessa tela:

- **O `https://` é obrigatório.** É ele que faz o Coolify pedir certificado ao
  Let's Encrypt. Ficando em `http://` não há TLS, e o `COOKIE_SECURE=true` que o
  compose fixa faz o browser descartar o cookie — ninguém consegue logar.
- **`Direction` pode ficar no default.** Ele é política de redirecionamento
  *entre os domínios que você cadastrou*, não algo que inventa hostname: a
  documentação exige que ambas as URLs estejam na lista para o ajuste ter
  efeito. Com um único domínio cadastrado, nenhuma rota `www.` é criada e
  nenhuma validação extra é tentada. Só mexa aqui se cadastrar as duas
  variantes — e aí ambas precisam de registro DNS próprio.
- **`Search engine indexing`: deixe não indexável.** Sistema interno de chão de
  fábrica. Não afeta a Play Store: a política em `/ztm/mobile` precisa estar
  publicamente acessível, não indexada.

O **DNS Check** fica em "DNS pending" até o registro A existir e apontar para o
IP público da VM. O botão **Recheck DNS** revalida.

⚠️ **Não edite `SERVICE_FQDN_FRONTEND` nem `SERVICE_URL_FRONTEND`.** São
geradas, a documentação as trata como não editáveis, e existe bug conhecido
(coolify#8912, coolify#6124) em que as formas genéricas — sem sufixo de porta —
continuam mostrando o domínio `sslip.io` antigo mesmo depois de você trocar o
domínio na UI. Aqui isso é irrelevante: **nada na stack lê essas variáveis.** A
declaração `SERVICE_FQDN_FRONTEND_8080` no compose serve apenas de gatilho para
o Coolify saber que o serviço tem domínio e em qual porta; o nginx só substitui
variáveis `APP_*` (`NGINX_ENVSUBST_FILTER=^APP_`) e quem alimenta o CORS é o
`APP_DOMAIN`.

O `APP_DOMAIN` precisa ser o mesmo host, sem o esquema — ele compõe o
`ALLOWED_ORIGINS` do backend, e se os dois divergirem o CORS recusa o próprio
frontend.

O domínio `sslip.io` gerado automaticamente costuma trazer o **IP privado** da
VM na Oracle (faixa `10.x.x.x`), porque é o único que a interface da máquina
enxerga — o público é NAT. Ou seja, ele não é alcançável de fora: não tente
validar o deploy por ele, o timeout parece falha e não é.

⚠️ **Sem caminho no domínio.** Preencha `https://app.seudominio.com.br`, nunca
`https://app.seudominio.com.br/ztm`. O `/ztm` é resolvido dentro do container,
pelo nginx: `/` responde 301 para `/ztm/`. Com caminho no domínio, o Coolify gera
`Host(...) && PathPrefix('/ztm')` mais um middleware `stripprefix` que remove o
prefixo — o nginx recebe `/`, redireciona para `/ztm/`, o Traefik remove de novo,
e o resultado é loop de redirecionamento.

O `db` e o `backend` não recebem domínio de propósito: ficam apenas na rede
interna da stack.

### 4. Antes do primeiro deploy

- Registro DNS **A** de `APP_DOMAIN` apontando para o IP público da VM. O Let's
  Encrypt valida por ele; sem DNS propagado não há certificado.
- Portas liberadas nos **dois** lugares: **Security List / NSG** da VCN na console
  da Oracle **e** no firewall da própria VM. Imagens Oracle Linux e Ubuntu da OCI
  vêm com `iptables`/`firewalld` descartando tudo fora do 22 — liberar só na
  console não basta.

  | Porta | Para quê | Obrigatória |
  | ----- | -------- | ----------- |
  | 80 | desafio HTTP-01 do Let's Encrypt e redirect para HTTPS | **sim** |
  | 443 | a aplicação | sim |
  | 8000 | UI do Coolify | para administrar |
  | 6001 | WebSocket do `coolify-realtime`: terminal e logs ao vivo | só para diagnóstico |

  Sem a 6001 a UI carrega, mas o Terminal falha com "Connection timeout /
  WebSocket error" — sintoma que parece problema do recurso e é só rede.

  A 80 não é opcional: o Coolify configura o Traefik com
  `acme.httpchallenge.entrypoint=http`, então o Let's Encrypt valida buscando
  `http://<domínio>/.well-known/acme-challenge/...` na porta 80. A 443 aberta
  não substitui — com a 80 fechada o certificado simplesmente não é emitido. A
  alternativa seria trocar para desafio DNS, que exige credencial de API do
  provedor de DNS e só se justifica quando a 80 é impossível.

  Confira de fora antes de dar Deploy, porque o **DNS Check** do Coolify valida
  apenas o registro A, não a alcançabilidade da porta:

  ```bash
  for p in 80 443 8000 6001; do
    curl -s -o /dev/null -w "$p: %{http_code}\n" --connect-timeout 8 \
      "http://<IP-PUBLICO>:$p/" || echo "$p: sem conexao"
  done
  ```

### 5. Deploy

`Deploy`. A ordem esperada nos logs:

1. `db` sobe e fica _healthy_.
2. `backend-migrate` roda `prisma migrate deploy` + seed e **sai com código 0**.
   Terminar é o comportamento correto: por isso o serviço tem
   `exclude_from_hc: true`, senão o Coolify marcaria a stack como unhealthy.
3. `backend` sobe e fica _healthy_.
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
embutidos no bundle pelo Vite em tempo de build. Edite o arquivo, commit, e faça
deploy com cache limpo se necessário.

**As migrations rodam a cada deploy**, no `backend-migrate`. O seed é
idempotente para o admin; conferir isso antes de habilitar `SEED_DEMO`.

**O teto de sessão desloga todos uma vez.** Token emitido antes do
`SESSION_ABSOLUTE_TTL` existir não tem o campo `authTime`, e é tratado como
expirado de propósito — aceitá-lo sem teto reabriria a brecha que o teto fecha.
Num ambiente novo isso é invisível (não há sessão ativa); ao atualizar uma
instalação existente, avise que será necessário refazer login.

**Backup do banco.** O `db_data` é um volume Docker gerenciado pelo Coolify. Um
volume vive na VM: snapshot da instância na OCI não é backup de banco. Configure
`mysqldump` agendado antes de haver dado real em produção.

**Se entrar Cloudflare (proxy laranja) na frente**, passe `TRUSTED_PROXY_HOPS`
para `3` no compose — o valor errado para baixo faz o `ThrottlerGuard` tratar a
planta inteira como um cliente só e devolver 429 indevido a 60 req/min; para
cima, permite forjar `X-Forwarded-For` e furar o limite.

---

## Pendências conhecidas

- `JWT_SECRET`, `ADMIN_PASSWORD` e `DEMO_PASSWORD` do repositório devem ser
  considerados comprometidos e rotacionados neste deploy.
- O repositório Git (`github.com/lchmereha/ZTM`) está **público**. Não há
  segredo em nenhum commit — só `.example` e os `frontend/.env.*`, que são
  configuração pública de build do Vite —, mas o código-fonte está exposto.
  Tornar privado exige deploy key no Coolify (permissão Admin, que só o dono da
  conta tem) e, para dar essa autonomia ao time, mover o repositório para uma
  organização.
- Backup do banco não está configurado. Ver "Backup do banco" acima; vira
  obrigatório antes de os coletores gravarem movimentação real.
