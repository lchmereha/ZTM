# 03 — Perfis de Acesso

## Papéis de Usuário

O sistema possui dois perfis de acesso:

### ADMIN (Administrador)

Acesso irrestrito a todas as funcionalidades do sistema.

**Responsabilidades:**
- Gerenciar usuários e permissões
- Configurar empresas, filiais e equipamentos
- Gerenciar chaves de API para integração
- Acessar todos os módulos de cadastro e consulta
- Realizar qualquer tipo de movimentação

**🔒 Módulos exclusivos ADMIN:**
- `rfid/usuario` — CRUD de usuários
- `rfid/api-key` — Gerenciamento de chaves de API

### OPERADOR (Operador)

Acesso restrito conforme permissões configuradas pelo ADMIN.

**Responsabilidades:**
- Operar movimentações de estoque (conforme tipo liberado)
- Realizar leituras RFID via app mobile
- Consultar posição de estoque e relatórios
- Manter cadastros de produtos (se autorizado)

**Módulos disponíveis (conforme permissão):**
- Empresa, Filial, Equipamento
- Tipo de Movimentação
- Categoria, Produto, Modelo de Etiqueta, Tag RFID
- Movimentações
- Consultas (Posição, Extrato, Entrada/Saída)
- Posição de Estoque

## Estrutura de Permissões

Cada módulo do sistema possui permissões granulares por operador:

| Permissão | Descrição |
|-----------|-----------|
| **Visualizar** | Ver registros e acessar a tela |
| **Incluir** | Criar novos registros |
| **Alterar** | Editar registros existentes |
| **Excluir** | Remover registros |

As permissões são configuradas por:
- **Usuário** — Cada operador tem seu conjunto de permissões
- **Módulo** — Cada tela do sistema é um módulo permssionável

## Multi-Filial

Usuários podem ter acesso a múltiplas filiais. Ao logar, o usuário seleciona qual filial está operando. É possível alternar entre filiais sem precisar relogar.

A filial ativa determina:
- Dados exibidos no dashboard
- Escopo dos cadastros e movimentações
- Branding visual (logo e cor da empresa)

<!-- SCREENSHOT: tela-selecao-filial -->

---
