-- CreateTable
CREATE TABLE `categorias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empresa` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empresas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `logo` LONGTEXT NULL,
    `cor_esquema` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_filial` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `ip_conexao` VARCHAR(191) NULL,
    `porta_conexao` INTEGER NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `tipo` ENUM('IMPRESSORA', 'ANTENA', 'SLED') NOT NULL,
    `exibe_conexao_socket` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `filiais` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empresa` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `endereco` VARCHAR(191) NULL,
    `documento_identificacao` VARCHAR(191) NULL,
    `cidade` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NULL,
    `cep` VARCHAR(191) NULL,
    `numero_logradouro` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `id_etiqueta_padrao` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `importacao_itens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_movimentacao` INTEGER NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NULL,
    `unidade_medida` VARCHAR(191) NULL,
    `quantidade` INTEGER NOT NULL DEFAULT 1,
    `qtde_um_volume` DECIMAL(15, 3) NULL,
    `categoria` VARCHAR(191) NULL,
    `codigo_unico` VARCHAR(191) NULL,
    `data_validade` DATETIME(3) NULL,
    `lote` VARCHAR(191) NULL,
    `data_fabricacao` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modelos_etiqueta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empresa` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `codigo_zpl` TEXT NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimentacoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_filial` INTEGER NOT NULL,
    `id_usuario` INTEGER NULL,
    `id_tipo_movimentacao` INTEGER NOT NULL,
    `id_equipamento` INTEGER NULL,
    `descricao` VARCHAR(191) NULL,
    `codigo_integracao` VARCHAR(191) NULL,
    `situacao` ENUM('CRIADO', 'IMPORTADO', 'PROCESSADO', 'FINALIZADO') NOT NULL DEFAULT 'CRIADO',
    `data_processamento` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimentacao_itens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_movimentacao` INTEGER NOT NULL,
    `id_tag_rfid` INTEGER NULL,
    `codigo_rfid` VARCHAR(191) NULL,
    `ocorrencia` ENUM('LEITURA', 'INCLUSAO', 'ENCONTRADO', 'NAO_ENCONTRADO') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `opcoes_menu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `chave` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `opcoes_menu_chave_key`(`chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produtos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empresa` INTEGER NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `unidade_medida` VARCHAR(191) NOT NULL,
    `id_categoria` INTEGER NULL,
    `id_modelo_etiqueta` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `produtos_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags_rfid` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_filial` INTEGER NOT NULL,
    `id_produto` INTEGER NOT NULL,
    `codigo_rfid` VARCHAR(191) NOT NULL,
    `codigo_unico` VARCHAR(191) NULL,
    `data_validade` DATETIME(3) NULL,
    `lote` VARCHAR(191) NULL,
    `data_fabricacao` DATETIME(3) NULL,
    `data_baixa` DATETIME(3) NULL,
    `qtde_um_volume` DECIMAL(15, 3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tags_rfid_codigo_rfid_key`(`codigo_rfid`),
    UNIQUE INDEX `tags_rfid_codigo_unico_key`(`codigo_unico`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipos_movimentacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empresa` INTEGER NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `faz_baixa` BOOLEAN NOT NULL DEFAULT false,
    `tipo` ENUM('IMPRESSAO', 'ASSOCIACAO', 'LEITURA', 'CONFERENCIA') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NULL,
    `usuario` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `senha` VARCHAR(191) NOT NULL,
    `regra` ENUM('OPERADOR', 'ADMIN') NOT NULL DEFAULT 'OPERADOR',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_usuario_key`(`usuario`),
    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissoes_usuario` (
    `id_usuario` INTEGER NOT NULL,
    `id_opcao_menu` INTEGER NOT NULL,
    `pode_visualizar` BOOLEAN NOT NULL DEFAULT false,
    `pode_incluir` BOOLEAN NOT NULL DEFAULT false,
    `pode_alterar` BOOLEAN NOT NULL DEFAULT false,
    `pode_excluir` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_usuario`, `id_opcao_menu`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios_filiais` (
    `id_usuario` INTEGER NOT NULL,
    `id_filial` INTEGER NOT NULL,

    PRIMARY KEY (`id_usuario`, `id_filial`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_keys` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_filial` INTEGER NOT NULL,
    `chave` VARCHAR(128) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `api_keys_chave_key`(`chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `categorias` ADD CONSTRAINT `categorias_id_empresa_fkey` FOREIGN KEY (`id_empresa`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipamentos` ADD CONSTRAINT `equipamentos_id_filial_fkey` FOREIGN KEY (`id_filial`) REFERENCES `filiais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `filiais` ADD CONSTRAINT `filiais_id_empresa_fkey` FOREIGN KEY (`id_empresa`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `filiais` ADD CONSTRAINT `filiais_id_etiqueta_padrao_fkey` FOREIGN KEY (`id_etiqueta_padrao`) REFERENCES `modelos_etiqueta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `importacao_itens` ADD CONSTRAINT `importacao_itens_id_movimentacao_fkey` FOREIGN KEY (`id_movimentacao`) REFERENCES `movimentacoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modelos_etiqueta` ADD CONSTRAINT `modelos_etiqueta_id_empresa_fkey` FOREIGN KEY (`id_empresa`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacoes` ADD CONSTRAINT `movimentacoes_id_filial_fkey` FOREIGN KEY (`id_filial`) REFERENCES `filiais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacoes` ADD CONSTRAINT `movimentacoes_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacoes` ADD CONSTRAINT `movimentacoes_id_tipo_movimentacao_fkey` FOREIGN KEY (`id_tipo_movimentacao`) REFERENCES `tipos_movimentacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacoes` ADD CONSTRAINT `movimentacoes_id_equipamento_fkey` FOREIGN KEY (`id_equipamento`) REFERENCES `equipamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacao_itens` ADD CONSTRAINT `movimentacao_itens_id_movimentacao_fkey` FOREIGN KEY (`id_movimentacao`) REFERENCES `movimentacoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacao_itens` ADD CONSTRAINT `movimentacao_itens_id_tag_rfid_fkey` FOREIGN KEY (`id_tag_rfid`) REFERENCES `tags_rfid`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produtos` ADD CONSTRAINT `produtos_id_categoria_fkey` FOREIGN KEY (`id_categoria`) REFERENCES `categorias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produtos` ADD CONSTRAINT `produtos_id_modelo_etiqueta_fkey` FOREIGN KEY (`id_modelo_etiqueta`) REFERENCES `modelos_etiqueta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tags_rfid` ADD CONSTRAINT `tags_rfid_id_filial_fkey` FOREIGN KEY (`id_filial`) REFERENCES `filiais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tags_rfid` ADD CONSTRAINT `tags_rfid_id_produto_fkey` FOREIGN KEY (`id_produto`) REFERENCES `produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tipos_movimentacao` ADD CONSTRAINT `tipos_movimentacao_id_empresa_fkey` FOREIGN KEY (`id_empresa`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissoes_usuario` ADD CONSTRAINT `permissoes_usuario_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissoes_usuario` ADD CONSTRAINT `permissoes_usuario_id_opcao_menu_fkey` FOREIGN KEY (`id_opcao_menu`) REFERENCES `opcoes_menu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_filiais` ADD CONSTRAINT `usuarios_filiais_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_filiais` ADD CONSTRAINT `usuarios_filiais_id_filial_fkey` FOREIGN KEY (`id_filial`) REFERENCES `filiais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_id_filial_fkey` FOREIGN KEY (`id_filial`) REFERENCES `filiais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

