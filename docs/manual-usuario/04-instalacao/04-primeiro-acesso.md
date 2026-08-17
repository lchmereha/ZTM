# 04/04 — Primeiro Acesso

## Credenciais Padrão

Após a instalação e seed do banco, o sistema cria automaticamente um usuário ADMIN:

| Campo | Valor Padrão |
|-------|-------------|
| **Usuário** | `ADMIN` |
| **Senha** | Conforme configurado em `ADMIN_PASSWORD` (ex: `Admin@123456`) |

## Tela de Login

<!-- SCREENSHOT: tela-login -->

1. Acesse a URL do sistema (ex: `http://localhost/ztm/`)
2. Informe **Usuário** ou **E-mail** no campo de login
3. Digite a **Senha**
4. Opcional: marque **"Lembrar-me"** para manter a sessão entre navegações
5. Clique em **Entrar**

> 💡 O login aceita tanto **nome de usuário** (maiúsculas/minúsculas) quanto **e-mail** cadastrado.

## Seleção de Filial

Após o login, selecione a filial que deseja operar:

<!-- SCREENSHOT: tela-selecao-filial -->

Cada filial pode ter:
- **Logotipo** e **cor** personalizados da empresa
- **Estoque** e **produtos** independentes
- **Equipamentos** configurados especificamente

> 💡 Você pode alternar de filial a qualquer momento pelo seletor no topo da página.

## Dashboard

Após selecionar a filial, o dashboard principal é exibido:

<!-- SCREENSHOT: tela-dashboard -->

Indicadores principais:
- **Tags Ativas** — Total de tags RFID em estoque
- **Produtos** — Total de produtos cadastrados
- **Movimentações Hoje** — Movimentações do dia
- **Pendentes** — Movimentações aguardando processamento

## Próximos Passos

1. ✏️ Verifique/altere seu perfil de usuário
2. ✏️ Configure a **Empresa** (logo, cores)
3. ✏️ Cadastre **Filiais** com endereço completo
4. ✏️ Configure **Equipamentos** (impressoras, antenas, sleds)
5. ✏️ Cadastre **Categorias** e **Produtos**
6. ✏️ Crie **Modelos de Etiqueta** (ZPL)
7. ✏️ Inicie as **Movimentações**

---
