# 05/02/06 — Chaves de API (API Keys)

🔒 **Acesso restrito a ADMIN**

## Sobre

Gerencia as chaves de autenticação para integração via API REST. Sistemas externos utilizam estas chaves para consumir a API de integração.

<!-- SCREENSHOT: tela-api-keys -->

## Campos do Cadastro

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Filial** | Sim | Filial à qual a chave está vinculada |
| **Chave** | Sim | Chave de API (gerada automaticamente) |

## Como Criar

1. ✏️ Clique em **"Novo"**
2. ✏️ Selecione a **Filial** que utilizará a chave
3. ✏️ A **Chave** é gerada automaticamente
4. ✏️ Clique em **"Salvar"**
5. ✏️ Copie a chave e envie ao integrador

> ⚠️ A chave é exibida apenas no momento da criação. Não é possível recuperá-la depois. Se perdida, gere uma nova e revogue a anterior.

## Uso na API

A chave deve ser enviada no header `x-api-key` em todas as requisições para a API de integração:

```http
GET /integracao/produto
x-api-key: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## Boas Práticas

- Crie chaves separadas para cada sistema integrador
- Revogue chaves de sistemas descontinuados
- Mantenha registro de qual chave pertence a qual integração

---
