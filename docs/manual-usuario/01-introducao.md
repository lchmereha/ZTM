# 01 — Introdução

## Sobre o Sistema

O **ZTM (ZZTech Trace Module)** é um sistema direcional de inventário que utiliza tecnologia **RFID (Radio-Frequency Identification)** para controle de estoque, rastreamento de produtos e gestão de movimentações logísticas.

O sistema substitui processos manuais de conferência por leitura automatizada via radiofrequência, permitindo:

- Inventário rápido e preciso com leitura de múltiplas etiquetas simultaneamente
- Rastreamento individual de produtos por tag RFID
- Controle de movimentações (entrada, saída, transferência, conferência)
- Integração com sistemas externos via API REST
- Operação em campo via aplicativo mobile com leitor RFID acoplado

## Arquitetura

```
+-------------------+       +-------------------+       +-------------------+
|                   |       |                   |       |                   |
|   Frontend Web    |<----->|   Backend API     |<----->|    MySQL 9.7      |
|   (React 19)      |       |   (NestJS 11)     |       |   (Prisma ORM)    |
|                   |       |                   |       |                   |
+-------------------+       +--------+----------+       +-------------------+
                                     ^
                                     |
+-------------------+                |
|                   |                |
|   App Mobile      |<---------------+
|   (Flutter)       |
|   + Leitor RFID   |
|   + Leitor Cód.   |
|   de Barras       |
+-------------------+
```

### Componentes

| Componente | Tecnologia | Função |
|------------|-----------|--------|
| **Frontend Web** | React 19, Vite 8, MUI v9 | Interface administrativa via navegador |
| **Backend API** | NestJS 11, Prisma 7 | Lógica de negócio e API REST |
| **Banco de Dados** | MySQL 9.7 | Persistência de dados |
| **App Mobile** | Flutter 3.x | Coletor RFID para operação em campo |
| **Proxy Reverso** | Nginx | Servir frontend e rotear API |

## Público-Alvo

- **Operadores de estoque** — Utilizam o app mobile para leitura RFID e conferência
- **Administradores** — Gerenciam cadastros, usuários e configurações pelo frontend web
- **TI / Integradores** — Realizam a integração via API REST e mantêm a infraestrutura

## Ambientes

| Ambiente | Uso | Acesso |
|----------|-----|--------|
| **Local** | Desenvolvimento e testes | `http://localhost` (ou porta configurada) |
| **Homologação** | Validação antes de produção | URL fornecida pela TI |
| **Produção** | Operação real | URL fornecida pela TI |

<!-- SCREENSHOT: tela-login -->

---
