-- AlterTable
ALTER TABLE `api_keys` ADD COLUMN `id_usuario` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `movimentacoes` ADD COLUMN `data_cancelamento` DATETIME(3) NULL,
    ADD COLUMN `id_usuario_cancelamento` INTEGER NULL,
    MODIFY `situacao` ENUM('CRIADO', 'IMPORTADO', 'PROCESSADO', 'FINALIZADO', 'CANCELADO') NOT NULL DEFAULT 'CRIADO';

-- AddForeignKey
ALTER TABLE `movimentacoes` ADD CONSTRAINT `movimentacoes_id_usuario_cancelamento_fkey` FOREIGN KEY (`id_usuario_cancelamento`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
