# 07 — Boas Práticas

## Cadastros

### Produtos
- Mantenha os códigos padronizados (SKU/EAN) — facilita integração com outros sistemas
- Utilize categorias para organizar produtos similares
- Associe um modelo de etiqueta padrão aos produtos mais usados

### Filiais
- Cadastre o endereço completo (CEP preenche automaticamente)
- Configure uma etiqueta padrão por filial se houver diferenças regionais
- ⚠️ Não exclua filiais com histórico — marque como inativa se necessário

### Equipamentos
- Mantenha IPs atualizados — impressoras e antenas mudam de IP com frequência
- Desative equipamentos temporariamente em vez de excluir
- Nomeie equipamentos de forma clara (ex: "Impressora Galpão Norte")

## Movimentações

### Importação CSV
- Use sempre o template disponível no sistema
- Valide os dados antes de importar (codificação UTF-8)
- Para grandes volumes, divida em múltiplos arquivos

### Operação RFID
- Mantenha o leitor estável durante a leitura
- Evite superfícies metálicas próximas às tags (interferência)
- Posicione a antena a uma distância adequada (consulte o manual do equipamento)
- Faça leituras de teste antes de iniciar a operação real

### Conferência
- Realize conferências periódicas para manter o estoque preciso
- Compare o relatório de divergências com o físico antes de finalizar
- Divergências pequenas podem ser ajustadas manualmente

## Administração

### Usuários
- Crie usuários individuais (não compartilhe contas)
- Atribua apenas as permissões necessárias para cada função
- Desative usuários que não utilizam mais o sistema
- Altere senhas periodicamente

### API Keys
- Crie chaves separadas para cada sistema integrador
- Mantenha um registro de qual chave pertence a qual integração
- Revogue chaves de sistemas descontinuados imediatamente

### Performance
- Evite períodos muito longos nos filtros de relatório
- Movimentações com muitos itens (>1000) podem ter processamento mais lento
- Programe operações de grande volume em horários de menor uso

## Segurança

- Utilize sempre HTTPS em produção
- Mantenha o `JWT_SECRET` com no mínimo 32 caracteres
- Configure `COOKIE_SECURE=true` em produção (HTTPS)
- Restrinja `ALLOWED_ORIGINS` às origens necessárias
- Não compartilhe chaves de API em repositórios de código

---
