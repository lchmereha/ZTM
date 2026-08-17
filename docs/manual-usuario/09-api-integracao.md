# 09 — API de Integração (REST)

## Visão Geral

A API de integração permite que sistemas externos consumam dados do ZTM via REST. A documentação interativa (Swagger) está disponível em `{backend-url}/docs`.

## Autenticação

Todas as requisições devem incluir o header `x-api-key`:

```http
GET /integracao/produto
x-api-key: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Content-Type: application/json
```

As chaves são gerenciadas no módulo **API Keys** do sistema (acesso ADMIN).

## Endpoints

### Produtos

**Criar Produto**

```http
POST /integracao/produto
x-api-key: {api_key}
Content-Type: application/json

{
  "codigo": "PROD001",
  "nome": "Parafuso 10mm",
  "unidadeMedida": "UN",
  "idCategoria": 1,
  "idModeloEtiqueta": 1
}
```

Pode criar categoria e modelo de etiqueta automaticamente se informar `nomeCategoria` ou `nomeModeloEtiqueta` no lugar dos IDs.

### Movimentações

**Criar Movimentação**

```http
POST /integracao/movimentacao
x-api-key: {api_key}
Content-Type: application/json

{
  "tipo": "IMPRESSAO",
  "idFilial": 1,
  "idEquipamento": 1,
  "descricao": "Integração sistema externo",
  "codigoIntegracao": "EXT-001",
  "itens": [
    {
      "codigo": "PROD001",
      "nome": "Parafuso 10mm",
      "unidadeMedida": "UN",
      "quantidade": 100,
      "lote": "LOTE001"
    }
  ]
}
```

**Listar Movimentações**

```http
GET /integracao/movimentacao
x-api-key: {api_key}
```

Retorna movimentações que não estão marcadas como `ocultaIntegracao`.

**Deletar Movimentação**

```http
DELETE /integracao/movimentacao/{id}
x-api-key: {api_key}
```

**Marcar como Lida**

```http
PATCH /integracao/movimentacao/{id}/lida?lida=true
x-api-key: {api_key}
```

### Tipos de Movimentação

```http
GET /integracao/tipo-movimentacao
x-api-key: {api_key}
```

### Empresa e Filial

```http
GET /integracao/empresa
GET /integracao/filial
x-api-key: {api_key}
```

### Posições de Estoque

**Listar**

```http
GET /integracao/posicao-estoque
x-api-key: {api_key}
```

**Criar**

```http
POST /integracao/posicao-estoque
x-api-key: {api_key}
Content-Type: application/json

{
  "idFilial": 1,
  "nome": "Prateleira A1"
}
```

**Atualizar**

```http
PUT /integracao/posicao-estoque/{id}
x-api-key: {api_key}
Content-Type: application/json

{
  "nome": "Prateleira A1 - Atualizada"
}
```

## Tratamento de Erros

A API retorna erros no formato padrão:

```json
{
  "statusCode": 400,
  "message": "Mensagem do erro",
  "error": "Bad Request"
}
```

| Código | Significado |
|--------|-------------|
| 400 | Requisição inválida (dados incorretos) |
| 401 | API Key ausente ou inválida |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: produto já existe) |
| 429 | Muitas requisições (rate limit) |
| 500 | Erro interno do servidor |

## Rate Limiting

O limite padrão é de **60 requisições por minuto** por IP.

## Swagger

A documentação interativa OpenAPI está disponível em:

```
{backend-url}/docs
```

<!-- SCREENSHOT: swagger-ui -->

---
