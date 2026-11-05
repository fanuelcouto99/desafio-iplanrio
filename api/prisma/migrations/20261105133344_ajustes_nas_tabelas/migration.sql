/*
  Warnings:

  - You are about to drop the `idempotecia` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `corridas` MODIFY `motoristaId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `idempotecia`;

-- CreateTable
CREATE TABLE `idempotency_keys` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `requestHash` VARCHAR(191) NOT NULL,
    `corridaId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `idempotency_keys_key_userId_idx`(`key`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
