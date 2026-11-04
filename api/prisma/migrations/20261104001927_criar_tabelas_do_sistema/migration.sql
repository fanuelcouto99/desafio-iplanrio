-- CreateTable
CREATE TABLE `corridas` (
    `id` VARCHAR(191) NOT NULL,
    `passageiroId` VARCHAR(191) NOT NULL,
    `motoristaId` VARCHAR(191) NOT NULL,
    `origem` VARCHAR(191) NOT NULL,
    `destino` VARCHAR(191) NOT NULL,
    `status` ENUM('SOLICITADA', 'ACEITA', 'EM_ANDAMENTO', 'FINALIZADA') NOT NULL DEFAULT 'SOLICITADA',
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `corridas_passageiroId_motoristaId_status_idx`(`passageiroId`, `motoristaId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `idempotecia` (
    `id` VARCHAR(191) NOT NULL,
    `chave` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `requestHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `idempotecia_chave_usuarioId_idx`(`chave`, `usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
