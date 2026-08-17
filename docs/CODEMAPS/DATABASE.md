# Database Codemap

**Last Updated:** 2026-06-19
**Provider:** MySQL 9.x (via Prisma 7 + `@prisma/adapter-mariadb`)
**Schema File:** `backend/prisma/schema.prisma`
**Migration Tool:** Prisma Migrate (`backend/prisma/migrations/`)

---

## ER Diagram (Logical)

```
empresas ──1:N── categorias ──1:N── produtos ──1:N── tags_rfid
  │                                                   │
  │                                                   │ (N:1)
  │                                                   ▼
  │                                               posicoes_estoque
  │
  ├──1:N── filiais ──1:N── equipamentos
  │         │             │
  │         │             └──1:N── movimentacoes
  │         │
  │         ├──1:N── tags_rfid
  │         ├──1:N── movimentacoes (origem)
  │         ├──1:N── movimentacoes (destino)
  │         ├──1:N── posicoes_estoque
  │         └──1:N── api_keys
  │
  └──1:N── modelos_etiqueta ──1:N── produtos
  │         │
  │         └──1:N── filiais (padrão)
  │
  └──1:N── tipos_movimentacao ──1:N── movimentacoes

usuarios ──N:N── filiais (usuarios_filiais)
  │
  └──N:N── opcoes_menu (permissoes_usuario)

movimentacoes ──1:N── importacao_itens
movimentacoes ──1:N── movimentacao_itens ──N:1── tags_rfid
```

---

## Models

### Empresa (Company)
**Table:** `empresas`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| nome | String | Company name |
| logo | String? (LongText) | Base64 logo image |
| corEsquema | String? | Branding accent color |
| createdAt | DateTime | Auto-generated |
| updatedAt | DateTime | Auto-updated |

**Relationships:**
- → `categorias` (1:N)
- → `filial` (1:N)
- → `modelos_etiqueta` (1:N)
- → `tipos_movimentacao` (1:N)

---

### Filial (Branch/Warehouse)
**Table:** `filiais`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| idEmpresa | Int (FK) | → empresas.id |
| nome | String | Branch name |
| endereco | String? | Address |
| documentoIdentificacao | String? | CNPJ/CPF |
| cidade | String? | City |
| estado | String? | State |
| cep | String? | Postal code |
| numeroLogradouro | String? | Street number |
| telefone | String? | Phone |
| idEtiquetaPadrao | Int? (FK) | → modelos_etiqueta.id |

**Relationships:**
- → `empresa` (N:1)
- → `equipamentos` (1:N)
- → `tags_rfid` (1:N)
- → `movimentacoes` (1:N as origem)
- → `movimentacoes_destino` (1:N as destino)
- → `api_keys` (1:N)
- → `posicoes_estoque` (1:N)
- → `etiquetaPadrao` (N:1, modelos_etiqueta)
- ← `usuarios_filiais` (N:N with usuarios)

---

### Categoria (Product Category)
**Table:** `categorias`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| idEmpresa | Int (FK) | → empresas.id |
| nome | String | Category name |
| ativo | Boolean | Active flag |

**Relationships:**
- → `empresa` (N:1)
- → `produtos` (1:N)

---

### Produto (Product)
**Table:** `produtos`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| idEmpresa | Int (FK) | → empresas.id |
| codigo | String (Unique) | Product SKU |
| nome | String | Product name |
| unidadeMedida | String | Unit of measure |
| idCategoria | Int? (FK) | → categorias.id |
| idModeloEtiqueta | Int? (FK) | → modelos_etiqueta.id |

**Relationships:**
- → `categoria` (N:1)
- → `modeloEtiqueta` (N:1)
- → `tags_rfid` (1:N)

---

### TagRfid (RFID Tag)
**Table:** `tags_rfid`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| idFilial | Int (FK) | → filiais.id |
| idProduto | Int (FK) | → produtos.id |
| codigoRfid | String | RFID EPC code |
| codigoUnico | String? | Unique identifier |
| idPosicaoEstoque | Int? (FK) | → posicoes_estoque.id |
| dataValidade | DateTime? | Expiration date |
| lote | String? | Batch/lot number |
| dataFabricacao | DateTime? | Manufacture date |
| dataBaixa | DateTime? | Deactivation date |
| qtdeUMVolume | Decimal? | Quantity per unit of measure |

**Relationships:**
- → `filial` (N:1)
- → `produto` (N:1)
- → `posicaoEstoque` (N:1)
- → `movimentacaoItems` (1:N)

---

### Movimentacao (Inventory Movement)
**Table:** `movimentacoes`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| idFilial | Int (FK) | Origin branch |
| idUsuario | Int? (FK) | Responsible user |
| idTipoMovimentacao | Int (FK) | Movement type |
| idEquipamento | Int? (FK) | RFID equipment used |
| descricao | String? | Description |
| codigoIntegracao | String? | External integration code |
| situacao | Enum | CRIADO, IMPORTADO, PROCESSADO, FINALIZADO |
| dataProcessamento | DateTime? | Processing timestamp |
| idFilialDestino | Int? (FK) | Destination branch (for transfers) |
| ocultaIntegracao | Boolean | Hide from integration API |

**Enums (SituacaoMovimentacao):**
- `CRIADO` — Created
- `IMPORTADO` — Imported (from CSV/external)
- `PROCESSADO` — Processed (tags assigned)
- `FINALIZADO` — Completed

**Relationships:**
- → `filial` (N:1, origem)
- → `filialDestino` (N:1, destino)
- → `usuario` (N:1)
- → `tipo` (N:1, tipos_movimentacao)
- → `equipamento` (N:1)
- → `importacaoItens` (1:N)
- → `itens` (1:N)

---

### MovimentacaoItem (Movement Item)
**Table:** `movimentacao_itens`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| idMovimentacao | Int (FK) | → movimentacoes.id |
| idTagRfid | Int? (FK) | → tags_rfid.id |
| codigoRfid | String? | RFID code (for unregistered tags) |
| ocorrencia | Enum | LEITURA, INCLUSAO, ENCONTRADO, NAO_ENCONTRADO |

**Enums (OcorrenciaItem):**
- `LEITURA` — Read event
- `INCLUSAO` — Inclusion
- `ENCONTRADO` — Found in audit
- `NAO_ENCONTRADO` — Not found in audit

---

### TipoMovimentacao (Movement Type)
**Table:** `tipos_movimentacao`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| idEmpresa | Int (FK) | → empresas.id |
| descricao | String | Type description |
| ativo | Boolean | Active flag |
| fazBaixa | Boolean | Performs stock write-off |
| tipo | Enum | IMPRESSAO, ASSOCIACAO, LEITURA, CONFERENCIA, TRANSFERENCIA |

**Enums (TipoOpcaoMovimentacao):**
- `IMPRESSAO` — Tag printing
- `ASSOCIACAO` — Tag → Product association
- `LEITURA` — RFID reading
- `CONFERENCIA` — Inventory conferencing
- `TRANSFERENCIA` — Inter-branch transfer

---

### Equipamento (RFID Equipment)
**Table:** `equipamentos`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| idFilial | Int (FK) | → filiais.id |
| nome | String | Equipment name |
| ipConexao | String? | IP address |
| portaConexao | Int? | Port number |
| ativo | Boolean | Active flag |
| tipo | Enum | IMPRESSORA, ANTENA, SLED |
| exibeConexaoSocket | Boolean | Show socket connection UI |

---

### ModeloEtiqueta (Label Template)
**Table:** `modelos_etiqueta`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| idEmpresa | Int (FK) | → empresas.id |
| nome | String | Template name |
| codigoZPL | String (Text) | ZPL printer code |
| ativo | Boolean | Active flag |

---

### Usuario (User)
**Table:** `usuarios`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| nome | String? | Display name |
| usuario | String (Unique) | Login username |
| email | String? (Unique) | Email |
| senha | String | bcrypt hashed password |
| regra | Enum | OPERADOR, ADMIN |
| ativo | Boolean | Active flag |

---

### PermissaoUsuario (User Permissions)
**Table:** `permissoes_usuario` (Composite PK: idUsuario, idOpcaoMenu)

| Column | Type | Description |
|--------|------|-------------|
| idUsuario | Int (FK) | → usuarios.id |
| idOpcaoMenu | Int (FK) | → opcoes_menu.id |
| podeVisualizar | Boolean | Can view |
| podeIncluir | Boolean | Can create |
| podeAlterar | Boolean | Can edit |
| podeExcluir | Boolean | Can delete |

---

### OpcaoMenu (Menu Options)
**Table:** `opcoes_menu`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| nome | String | Display name |
| chave | String (Unique) | Permission key |
| ativo | Boolean | Active flag |

---

### ImportacaoItem (Import Items)
**Table:** `importacao_itens`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| idMovimentacao | Int (FK) | → movimentacoes.id (Cascade delete) |
| codigo | String | Product code |
| nome | String? | Product name |
| unidadeMedida | String? | Unit of measure |
| quantidade | Int | Quantity |
| qtdeUMVolume | Decimal? | Qty per UM volume |
| categoria | String? | Category name |
| codigoUnico | String? | Unique code |
| dataValidade | DateTime? | Expiration |
| lote | String? | Batch |
| dataFabricacao | DateTime? | Manufacture date |
| posicaoEstoque | String? | Stock position |

---

### PosicaoEstoque (Stock Position)
**Table:** `posicoes_estoque`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| idFilial | Int (FK) | → filiais.id |
| nome | String | Position name |
| ativo | Boolean | Active flag |

---

### ApiKey (External API Keys)
**Table:** `api_keys`

| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| idFilial | Int (FK) | → filiais.id |
| chave | String (Unique, VarChar 128) | API key hash |

---

### UsuarioFilial (User-Branch Assignment)
**Table:** `usuarios_filiais` (Composite PK: idUsuario, idFilial)

| Column | Type | Description |
|--------|------|-------------|
| idUsuario | Int (FK) | → usuarios.id |
| idFilial | Int (FK) | → filiais.id |

---

## Key Indexes

| Table | Index | Type |
|-------|-------|------|
| `produtos` | `codigo` | Unique |
| `usuarios` | `usuario` | Unique |
| `usuarios` | `email` | Unique |
| `opcoes_menu` | `chave` | Unique |
| `api_keys` | `chave` | Unique |
| All tables | `id` | Primary Key (auto-increment) |
| All FK columns | `fk_*` | Foreign Key |

---

## Migration Workflow

```bash
# Generate migration
cd backend
npx prisma migrate dev --name description_of_change

# Apply to production
npx prisma migrate deploy

# Generate Prisma client (after schema changes)
npx prisma generate

# Seed database
npm run seed
```

---

## Data Access Pattern

```typescript
// PrismaService (extends PrismaClient) is injected into services
@Injectable()
export class ProdutoService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: DatatablesDto) {
    return this.prisma.produto.findMany({
      where: { idEmpresa: this.tenant.currentEmpresaId },
      include: { categoria: true, modeloEtiqueta: true },
      skip: filters.offset,
      take: filters.limit,
    });
  }
}
```
