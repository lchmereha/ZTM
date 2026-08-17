# Manual do Usuário — ZTM Sistema Direcional de Inventário (RFID)

**Versão do Sistema:** 1.0.0  
**Última Atualização:** Junho/2026

---

## Sobre este Manual

Este documento é o guia completo de uso do **ZTM (ZZTech Trace Module)**, sistema direcional de inventário baseado em tecnologia RFID para controle de estoque, rastreamento de produtos e movimentações logísticas.

O manual abrange os três componentes do sistema:
- **Web** (Frontend React) — Interface administrativa e operacional via navegador
- **API** (Backend NestJS) — Integração com sistemas externos
- **Mobile** (App Flutter) — Coletor RFID para operação em campo

---

## Índice Completo

### Parte 1 — Visão Geral
| Capítulo | Descrição |
|----------|-----------|
| [01 - Introdução](01-introducao.md) | Visão geral do sistema, arquitetura e stack tecnológica |
| [02 - Conceitos](02-conceitos.md) | Glossário de termos técnicos e de negócio |
| [03 - Perfis de Acesso](03-perfis-acesso.md) | Papéis de usuário, permissões e responsabilidades |

### Parte 2 — Instalação e Configuração
| Capítulo | Descrição |
|----------|-----------|
| [04/01 - Setup Docker](04-instalacao/01-docker.md) | Instalação via Docker Compose |
| [04/02 - Setup Manual](04-instalacao/02-manual.md) | Instalação manual sem Docker |
| [04/03 - Variáveis de Ambiente](04-instalacao/03-variaveis-ambiente.md) | Referência completa de variáveis |
| [04/04 - Primeiro Acesso](04-instalacao/04-primeiro-acesso.md) | Login inicial e configuração |

### Parte 3 — Manual do Frontend Web
| Capítulo | Descrição |
|----------|-----------|
| [05/01 - Dashboard](05-web/01-dashboard.md) | Indicadores, gráficos e visão geral |
| [05/02 - Configurações](05-web/02-configuracoes/01-usuarios.md) | Usuários, empresas, filiais, etc. |
| [05/03 - Produtos](05-web/03-produtos/01-categorias.md) | Categorias, produtos, etiquetas, tags |
| [05/04 - Movimentações](05-web/04-movimentacoes.md) | Coração do sistema: fluxo operacional |
| [05/05 - Consultas](05-web/05-consultas/01-posicao-estoque.md) | Relatórios e extrato |

### Parte 4 — Manual do App Mobile
| Capítulo | Descrição |
|----------|-----------|
| [06/01 - Visão Geral](06-mobile/01-visao-geral.md) | O app ZZTech Trace Module |
| [06/02 - Instalação](06-mobile/02-instalacao.md) | Instalação no dispositivo Android |
| [06/03 - Login](06-mobile/03-login.md) | Autenticação e configuração |
| [06/04 - Operação](06-mobile/04-operacao.md) | Operação diária com RFID |
| [06/05 - Impressão ZPL](06-mobile/05-impressao-zpl.md) | Impressão de etiquetas |

### Parte 5 — Referência
| Capítulo | Descrição |
|----------|-----------|
| [07 - Boas Práticas](07-boas-praticas.md) | Orientações e recomendações |
| [08 - Troubleshooting](08-troubleshooting.md) | Problemas comuns e soluções |
| [09 - API de Integração](09-api-integracao.md) | Documentação da API REST externa |
| [10 - FAQ](10-faq.md) | Perguntas frequentes |

---

## Convenções Usadas neste Manual

| Símbolo | Significado |
|---------|-------------|
| ✏️ | Ação que o usuário deve realizar |
| ⚠️ | Atenção: ponto crítico |
| 💡 | Dica ou boa prática |
| 🔒 | Requer perfil ADMIN |

---

## Suporte

Para reportar problemas ou solicitar melhorias, utilize o sistema de chamados interno ou entre em contato com a equipe de TI.

---
