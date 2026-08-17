-- AlterTable
ALTER TABLE `importacao_itens` ADD COLUMN `posicao_estoque` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `movimentacoes` ADD COLUMN `id_filial_destino` INTEGER NULL;

-- AlterTable
ALTER TABLE `tipos_movimentacao` MODIFY `tipo` ENUM('IMPRESSAO', 'ASSOCIACAO', 'LEITURA', 'CONFERENCIA', 'TRANSFERENCIA') NOT NULL;

-- AddForeignKey
ALTER TABLE `movimentacoes` ADD CONSTRAINT `movimentacoes_id_filial_destino_fkey` FOREIGN KEY (`id_filial_destino`) REFERENCES `filiais`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
