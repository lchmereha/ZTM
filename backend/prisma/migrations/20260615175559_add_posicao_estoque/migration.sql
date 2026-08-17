-- AlterTable
ALTER TABLE `tags_rfid` ADD COLUMN `id_posicao_estoque` INTEGER NULL;

-- CreateTable
CREATE TABLE `posicoes_estoque` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_filial` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `posicoes_estoque` ADD CONSTRAINT `posicoes_estoque_id_filial_fkey` FOREIGN KEY (`id_filial`) REFERENCES `filiais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tags_rfid` ADD CONSTRAINT `tags_rfid_id_posicao_estoque_fkey` FOREIGN KEY (`id_posicao_estoque`) REFERENCES `posicoes_estoque`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
