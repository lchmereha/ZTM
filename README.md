# Sistema Direcional de Inventário (RFID)

Sistema completo de controle de estoque e identificação via RFID, composto por um **backend NestJS**, **frontend React (Vite)** e **app mobile Flutter**.

---

## Arquitetura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │     │   Backend    │     │   Mobile     │
│  React + Vite│────▶│ NestJS +     │◀────│ Flutter      │
│  MUI v9      │    │ Prisma ORM   │     │ RFID/Barcode │
│  /ztm/       │    │ :3000        │     │ Coletor      │
└──────┬───────┘     └──────┬───────┘     └──────────────┘
       │                    │
       │         ┌──────────▼──────────┐
       │         │      MySQL 9.7      │
       └────────▶│    (Docker/On-prem) │
                 └─────────────────────┘
```

### Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + Vite + MUI v9 | React 19 |
| Backend | NestJS + Prisma + MySQL | NestJS 11 |
| Mobile | Flutter + Dart | SDK 3.12 |
| Database | MySQL | 9.7 |
| Proxy | Nginx (frontend) | Latest |
| Container | Docker Compose | 3 services |

---

## Manual de Utilização do Sistema

Bem-vindo ao Sistema de Controle de Estoque e Identificação! Este portal foi
elaborado para ajudar você a visualizar, automatizar e rastrear o fluxo e
posicionamento dos seus produtos utilizando tecnologia de leitura RFID.

---

### Onde eu começo? A Jornada no Sistema

Para que o sistema consiga rastrear os itens perfeitamente, você precisará
configurar o fluxo de informações através de alguns passos muito simples.

#### 1. Acesso e Segurança (Usuários do Sistema)

O ambiente é totalmente restrito e protegido. Antes de iniciar qualquer
configuração, você precisa de uma conta de acesso válida.

- O sistema conta com restrição por perfis de acesso, dividindo as permissões em
  **Administradores (ADMIN)** e **Operadores (OPERADOR)**. O administrador raiz
  inicialmente configurado possuirá acesso pleno para convidar os demais
  usuários de suas filiais.
- A gestão de usuários está disponível exclusivamente para administradores
  através da seção **Usuários**, onde é possível cadastrar, editar e remover
  contas, definir perfis de acesso e vincular cada usuário a uma filial.
- Módulos restritos a administradores ficam automaticamente ocultos no menu
  lateral para colaboradores com perfil OPERADOR.

#### 2. Configurando a Estrutura (Empresas e Filiais)

Sua organização possui locais físicos onde o estoque transita.

- Entre na seção de **Empresas** e cadastre o seu negócio principal.
- Em seguida, acesse **Filiais** e liste todas as suas lojas, galpões de
  distribuição e estoques que participarão da operação.

#### 3. Mapeamento de Leitura (Equipamentos)

Sua filial possuirá aparelhos responsáveis por ler os produtos em tempo real
(como antenas, coletores ou impressoras).

- Acesse a área de **Equipamentos** e adicione seus aparelhos no sistema,
  apontando onde eles estão instalados em suas Filiais (ex: Doca 1, Saída da
  Loja).
- Tipos de equipamento: `ANTENA`, `SLED` (coletor), `IMPRESSORA`.
- Equipamentos do tipo `ANTENA` e `SLED` podem exibir campos de conexão socket
  (IP/porta) para integração em tempo real.

#### 4. Cadastrando o Catálogo (Produtos)

Você precisa listar o que realmente é movimentado em sua operação comercial.

- Vá na guia de **Produtos** e insira os dados base. Crie códigos de produto,
  preencha descrições e defina unidades (caixa, peça, unidade, litro).
- Organize seus produtos em **Categorias** para facilitar a busca e filtragem.

#### 5. Modelos de Etiqueta

Personalize a impressão das etiquetas RFID com templates ZPL.

- Cadastre **Modelos de Etiqueta** com código ZPL para cada tipo de produto.
- Utilize variáveis como `{{produto.nome}}`, `{{produto.codigo}}` no ZPL.
- Associe um modelo padrão a uma filial para agilizar a impressão.

#### 6. Tags RFID

Vincule tags RFID físicas aos seus produtos.

- Cadastre lotes de etiquetas e associe cada tag a um produto e filial.
- Informe opcionalmente: lote, data de validade, data de fabricação e posição
  de estoque.
- Tags podem ser baixadas (desativadas) individualmente.

#### 7. Tipos de Movimentação

Configure os tipos de operação realizadas no sistema:

| Tipo | Operação | Descrição |
|------|----------|-----------|
| `IMPRESSAO` | Impressão | Geração de novas etiquetas RFID |
| `ASSOCIACAO` | Associação | Vinculação de tags a produtos |
| `LEITURA` | Leitura | Inventário por leitura de tags |
| `CONFERENCIA` | Conferência | Verificação de estoque |
| `TRANSFERENCIA` | Transferência | Movimentação entre filiais |

Cada tipo pode ser configurado para dar baixa no estoque automaticamente
(`fazBaixa`).

#### 8. Posições de Estoque

Organize fisicamente seu estoque em posições dentro de cada filial.

- Cadastre posições como prateleiras, corredores ou docks.
- Associe tags RFID a posições específicas para rastreamento preciso.

#### 9. Acompanhamento Contínuo (Movimentações)

Esse é o coração da operação diária!

- Uma vez com tudo configurado, você acessará a área de **Movimentações**. É
  aqui que o sistema guardará os registros em tempo real: todas as entradas,
  saídas e transferências de cada item, indicando o dia, a hora de passagem e
  exatamente qual equipamento/antena detectou seus produtos.
- Situações: `CRIADO` → `IMPORTADO` → `PROCESSADO` → `FINALIZADO`.

#### 10. Consultas e Relatórios

Acompanhe seu estoque com relatórios detalhados:

- **Posição de Estoque** — Visualize o saldo atual por produto/filial.
- **Extrato de Movimentação** — Histórico completo de movimentações.
- **Entrada e Saída** — Relatório consolidado de entradas e saídas.
- **Dashboard** — Gráficos e indicadores do painel inicial.

---

## Setup Rápido (Docker)

### Pré-requisitos

- Docker e Docker Compose
- Git

### 1. Clone e configure

```bash
git clone <seu-repositorio>
cd ZTM

# Crie os arquivos .env a partir dos exemplos
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### 2. Edite as variáveis de ambiente

Edite o arquivo `.env` na raiz com suas credenciais MySQL:

```env
DB_NAME=ztm_db
DB_ROOT_PASS=sua_senha_root
DB_USER=ztm_app
DB_PASS=sua_senha_app
```

**Importante:** As credenciais no `.env` da raiz DEVEM ser idênticas às do
arquivo `backend/.env.local` (campo `DATABASE_URL`).

### 3. Suba os containers

```bash
# Ambiente local (simula produção em rede local)
docker compose -f docker-compose-local.yml up -d

# Ambiente de desenvolvimento (com hot-reload)
docker compose -f docker-compose-development.yml up -d
```

Acesse o sistema em: **http://localhost/ztm/**

### 4. Credenciais padrão

Após o primeiro seed, o sistema cria automaticamente um administrador:

- **Usuário:** definido em `ADMIN_USERNAME` no `.env`
- **Senha:** definida em `ADMIN_PASSWORD` no `.env`

---

## Ambientes

| Arquivo | Finalidade |
|---------|-----------|
| `docker-compose-local.yml` | Simula produção em rede local (build otimizado) |
| `docker-compose-development.yml` | Desenvolvimento com hot-reload |
| `docker-compose-production.yml` | Produção em nuvem (WIP) |

Cada ambiente tem seu próprio conjunto de `.env.*`:

| Arquivo | Ambiente |
|---------|----------|
| `backend/.env` | Desenvolvimento local (sem Docker) |
| `backend/.env.local` | Docker local (produção simulada) |
| `backend/.env.development` | Docker desenvolvimento |
| `backend/.env.production` | Produção |
| `frontend/.env.local` | Frontend Docker local |
| `frontend/.env.development` | Frontend Docker desenvolvimento |
| `frontend/.env.production` | Frontend produção |

---

## Documentação da API

### Swagger (Integração)

A API de integração (protegida por API Key) possui documentação Swagger
disponível em:

```
http://localhost:3000/docs
```

Endpoints disponíveis para integração externa:

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/integracao/produto` | Cadastrar produto |
| POST | `/integracao/movimentacao` | Criar movimentação |
| DELETE | `/integracao/movimentacao/:id` | Excluir movimentação |
| GET | `/integracao/movimentacao` | Listar movimentações |
| PATCH | `/integracao/movimentacao/:id/lida` | Marcar como lida |
| GET | `/integracao/tipo-movimentacao` | Listar tipos |
| GET | `/integracao/empresa` | Consultar empresa |
| GET | `/integracao/filial` | Consultar filial |
| GET | `/integracao/posicao-estoque` | Listar posições |
| POST | `/integracao/posicao-estoque` | Criar posição |
| PUT | `/integracao/posicao-estoque/:id` | Atualizar posição |

### API Interna (Autenticada via cookie JWT)

A API interna é consumida pelo frontend React e inclui módulos para todas as
entidades do sistema. A documentação completa dos endpoints internos está
disponível no código-fonte dos controllers em `backend/src/`.

---

## Módulos do Frontend

O frontend React organiza-se nas seguintes seções:

```
/ztm/                              ─ Dashboard
/ztm/rfid/usuario                  ─ Usuários (ADMIN)
/ztm/rfid/empresa                  ─ Empresas
/ztm/rfid/filial                   ─ Filiais
/ztm/rfid/equipamento              ─ Equipamentos
/ztm/rfid/tipo-movimentacao        ─ Tipos de Movimentação
/ztm/rfid/api-key                  ─ API Keys (ADMIN)
/ztm/rfid/cadastro-posicao-estoque ─ Posições de Estoque
/ztm/rfid/categoria                ─ Categorias
/ztm/rfid/produto                  ─ Produtos
/ztm/rfid/modelo-etiqueta          ─ Modelos de Etiqueta
/ztm/rfid/tag-rfid                 ─ Tags RFID
/ztm/rfid/movimentacao             ─ Movimentações
/ztm/rfid/posicao-estoque          ─ Consulta: Posição
/ztm/rfid/extrato-movimentacao     ─ Consulta: Extrato
/ztm/rfid/entrada-saida            ─ Consulta: Entrada/Saída
```

---

## Mobile (Flutter)

O app mobile "ZZTech Trace Module" permite a coleta via:

- **Leitor RFID** — acoplamento via Bluetooth (pacote `rfid_reader` local)
- **Leitor de Código de Barras** — câmera do dispositivo (`barcode_scanner`)
- **Bluetooth LE** — comunicação com dispositivos (`flutter_blue_plus`)

---

## Boas Práticas

- Mantenha o cadastro de Produtos sempre atualizado.
- Nunca remova uma Filial ou um Equipamento que já esteja acumulando registros
  de movimentação, pois eles são essenciais para o histórico posterior.
- Utilize a flag `ocultaIntegracao` para marcar movimentações como processadas
  sem excluí-las do banco.
- Para ambientes HTTP (rede local), mantenha `COOKIE_SECURE=false`.
- Ambientes HTTPS (produção) devem definir `COOKIE_SECURE=true`.

---

## Estrutura de Diretórios

```
ZTM/
├── backend/               # NestJS API
│   ├── prisma/            # Schema e migrations do banco
│   │   ├── schema.prisma  # Modelo de dados completo
│   │   ├── migrations/    # Migrations MySQL
│   │   └── seed.ts        # Seed inicial (admin)
│   ├── src/
│   │   ├── auth/          # Autenticação JWT
│   │   ├── integracao/    # API de integração (API Key)
│   │   ├── empresa/       # CRUD empresas
│   │   ├── filial/        # CRUD filiais
│   │   ├── equipamento/   # CRUD equipamentos
│   │   ├── produto/       # CRUD produtos
│   │   ├── categoria/     # CRUD categorias
│   │   ├── movimentacao/  # CRUD movimentações
│   │   ├── tag-rfid/      # CRUD tags RFID
│   │   ├── usuario/       # CRUD usuários
│   │   ├── permissao/     # Permissões por menu
│   │   ├── modelo-etiqueta/  # Templates ZPL
│   │   ├── tipo-movimentacao/ # Tipos de operação
│   │   ├── api-key/       # Gerenciamento de chaves
│   │   ├── posicao-estoque/  # Posições físicas
│   │   ├── dashboard/     # Dados do dashboard
│   │   ├── relatorio/     # Relatórios
│   │   ├── common/        # Interceptors, guards, helpers
│   │   └── prisma/        # Serviço Prisma
│   └── test/              # Testes e2e
├── frontend/              # React + Vite
│   └── src/
│       ├── views/rfid/    # Páginas do sistema
│       ├── layout/        # Layout principal e menu
│       ├── themes/        # Tema MUI personalizado
│       ├── contexts/      # Contextos (Auth, Dialog, Snackbar)
│       ├── services/      # Serviços de API
│       ├── routes/        # Configuração de rotas
│       └── menu-items/    # Definição do menu lateral
├── mobile/                # Flutter (coletor RFID)
└── docker-compose-*.yml   # Orquestração Docker
```

## Documentação

- **[Manual do Usuário](docs/manual-usuario/README.md)** — Guia completo de uso do sistema
- **[Codemaps](docs/CODEMAPS/INDEX.md)** — Mapas de navegação do código-fonte
#   Z T M  
 