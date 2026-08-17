# 08 — Troubleshooting

## Problemas Comuns

### Login

| Problema | Causa Provável | Solução |
|----------|---------------|---------|
| **"Usuário ou senha inválidos"** | Credenciais incorretas | Verifique usuário e senha |
| **Login não persiste** | Cookie bloqueado | Ative cookies no navegador |
| **Sessão expirada** | Token expirou | Faça login novamente |
| **Tela de login não carrega** | Servidor offline | Verifique se o backend está rodando |

### Frontend

| Problema | Causa Provável | Solução |
|----------|---------------|---------|
| **Página em branco** | Erro de build ou rota | Verifique console do navegador (F12) |
| **"Network Error"** | Backend inacessível | Verifique se o backend está na porta correta |
| **Dados não carregam** | CORS bloqueado | Verifique `ALLOWED_ORIGINS` no backend |
| **Estilos quebrados** | Cache do navegador | Limpe o cache (Ctrl+F5) |
| **Rota não encontrada** | Base name incorreto | Verifique `VITE_APP_BASE_NAME` |

### Movimentações

| Problema | Causa Provável | Solução |
|----------|---------------|---------|
| **CSV não importa** | Formato inválido | Use UTF-8, verifique colunas obrigatórias |
| **Tags não processam** | Produto não encontrado | Cadastre o produto antes de processar |
| **Impressão não funciona** | Impressora offline | Verifique IP e porta da impressora |
| **Não consegue finalizar** | Itens pendentes | Processe todos os itens antes de finalizar |
| **Baixa não efetuada** | Tipo sem flag fazBaixa | Configure o tipo com `fazBaixa=true` |

### App Mobile

| Problema | Causa Provável | Solução |
|----------|---------------|---------|
| **Não conecta ao leitor RFID** | Bluetooth desligado | Ative Bluetooth e Localização |
| **Leitor não aparece na busca** | Fora do alcance | Aproxime o leitor do dispositivo |
| **Leitura instável** | Interferência | Afaste de superfícies metálicas |
| **App fecha ao abrir** | Permissões negadas | Conceda permissões de Bluetooth e Localização |
| **"Servidor não encontrado"** | URL incorreta | Verifique a URL do servidor nas configurações |
| **Impressão falha** | Rede diferente | Mesma rede Wi-Fi da impressora |

### Docker / Infraestrutura

| Problema | Causa Provável | Solução |
|----------|---------------|---------|
| **Container não sobe** | Porta ocupada | Verifique se a porta 3306/3000/80 está livre |
| **Backend reinicia em loop** | Erro de conexão DB | Verifique `DATABASE_URL` e credenciais |
| **Banco não acessível** | Volume corrompido | `docker compose down -v` e recrie |
| **Migration falha** | Schema desatualizado | Execute `npx prisma migrate deploy` |

## Logs

### Backend (Docker)

```bash
docker compose logs -f backend
```

### Backend (Manual)

Verifique o terminal onde o `npm run start:dev` está rodando.

### Frontend (Navegador)

Pressione `F12` e acesse a aba **Console** ou **Network**.

## Como Reportar um Problema

Ao reportar um problema, informe:

1. **Ambiente:** Local / Homologação / Produção
2. **Tela/Módulo:** Onde ocorreu
3. **Passos:** Como reproduzir
4. **Comportamento esperado:** O que deveria acontecer
5. **Comportamento real:** O que aconteceu
6. **Logs/Mensagens:** Erros exibidos

---
