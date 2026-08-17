# 05/02/01 — Usuários

🔒 **Acesso restrito a ADMIN**

## Sobre

Gerencia os usuários do sistema, seus perfis de acesso e vínculo com filiais.

<!-- SCREENSHOT: tela-usuarios -->

## Campos do Cadastro

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Nome** | Não | Nome completo do usuário |
| **Usuário** | Sim | Nome de login (ex: JOAO.SILVA) |
| **E-mail** | Não | E-mail para login alternativo |
| **Senha** | Sim | Senha de acesso |
| **Regra** | Sim | Perfil: ADMIN ou OPERADOR |
| **Ativo** | Sim | Se o usuário pode acessar o sistema |
| **Filiais** | Sim | Filiais às quais o usuário tem acesso |
| **Permissões** | Sim* | Permissões por módulo (* obrigatório para OPERADOR) |

## Como Criar um Usuário

1. ✏️ Clique em **"Novo"**
2. ✏️ Preencha os campos obrigatórios
3. ✏️ Selecione **Regra** (ADMIN ou OPERADOR)
4. ✏️ Vincule às **Filiais** que o usuário poderá acessar
5. ✏️ Configure as **Permissões** do operador
6. ✏️ Clique em **"Salvar"**

## Permissões por Módulo

Para usuários OPERADOR, configure permissões específicas:

| Módulo | Visualizar | Incluir | Alterar | Excluir |
|--------|:----------:|:-------:|:-------:|:-------:|
| Empresa | ✅ | ✅ | ✅ | ✅ |
| Filial | ✅ | ✅ | ✅ | ✅ |
| Equipamento | ✅ | ✅ | ✅ | ✅ |
| Tipo Movimentação | ✅ | ✅ | ✅ | ✅ |
| Posição de Estoque | ✅ | ✅ | ✅ | ✅ |
| Categoria | ✅ | ✅ | ✅ | ✅ |
| Produto | ✅ | ✅ | ✅ | ✅ |
| Modelo de Etiqueta | ✅ | ✅ | ✅ | ✅ |
| Tag RFID | ✅ | ✅ | ✅ | ✅ |
| Movimentação | ✅ | ✅ | ✅ | ✅ |

> 💡 Marque apenas as permissões necessárias para a função do operador.

## Filtros

<!-- SCREENSHOT: filtro-usuarios -->

- Nome / Usuário / E-mail
- Regra (ADMIN / OPERADOR)
- Ativo / Inativo
- Filial vinculada

---
