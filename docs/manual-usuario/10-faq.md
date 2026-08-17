# 10 — FAQ (Perguntas Frequentes)

## Gerais

### O que é o ZTM?
ZTM (ZZTech Trace Module) é um sistema de controle de inventário baseado em RFID para rastreamento e gestão de estoque.

### Quais são os componentes do sistema?
O sistema possui três componentes: Frontend Web (React), Backend API (NestJS) e App Mobile (Flutter).

### Preciso de equipamentos especiais?
Sim, para operação em campo são necessários leitores RFID (antenas, sleds ou dispositivos portáteis) e impressoras ZPL para etiquetas.

## Usuários e Acesso

### Como recuperar minha senha?
Atualmente o sistema não possui recuperação automática de senha. Solicite ao administrador para redefini-la.

### Posso acessar mais de uma filial?
Sim. Usuários podem ter acesso a múltiplas filiais. Basta usar o seletor no topo da página.

### Qual a diferença entre ADMIN e OPERADOR?
ADMIN tem acesso irrestrito a todas as funcionalidades. OPERADOR tem acesso limitado conforme permissões configuradas.

## RFID

### Qual a distância máxima de leitura?
Depende do equipamento: antenas fixas (Impinj) podem ler até 10m, sleds portáteis até 3m.

### Uma tag pode ser reutilizada?
Sim, desde que não tenha sido dada baixa. Para reutilizar, é necessário desassociar do produto atual.

### O que fazer se uma tag não é lida?
Verifique: bateria do leitor, distância da tag, interferência metálica, e se a tag não está danificada.

### Posso ler múltiplas tags ao mesmo tempo?
Sim, essa é a principal vantagem do RFID. O sistema lê dezenas de tags por segundo simultaneamente.

## Movimentações

### Posso editar uma movimentação finalizada?
Não. Movimentações finalizadas são bloqueadas para edição. Crie uma nova movimentação para ajustes.

### O que significa "fazBaixa"?
Quando ativo, a movimentação remove os itens do estoque ativo ao ser concluída (ex: transferência, venda).

### Como importar itens em lote?
Utilize a importação CSV na tela de movimentação. O sistema fornece um template para download.

### Uma movimentação pode ter itens de diferentes produtos?
Sim. Uma única movimentação pode conter múltiplos produtos e tags.

## Mobile

### O app funciona offline?
Algumas funcionalidades (como leitura simples) funcionam offline, mas a maioria requer conexão com o servidor.

### Quais leitores RFID são compatíveis?
Chainway, Honeywell (IH25, R6, C72) via BLE e Impinj (R3, UR4) via WebSocket.

### Preciso de internet para usar o app?
Sim, para criar e finalizar movimentações. A leitura local pode ser feita offline.

## Técnico

### Como atualizar o sistema?
Para Docker: `docker compose pull && docker compose up -d`. Para manual: `git pull && npm install && npm run build`.

### Onde ficam os logs?
Backend: logs no terminal ou `docker compose logs -f backend`. Frontend: console do navegador (F12).

### Como fazer backup do banco?
```bash
docker compose exec db mysqldump -u ztm_app -p ztm_db > backup.sql
```

### Posso integrar com meu ERP?
Sim, através da API REST de integração. Consulte a [documentação da API](09-api-integracao.md).

---
