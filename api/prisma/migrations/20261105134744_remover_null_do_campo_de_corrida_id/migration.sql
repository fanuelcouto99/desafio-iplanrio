/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `idempotency_keys` table. All the data in the column will be lost.
  - Made the column `corridaId` on table `idempotency_keys` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `idempotency_keys` DROP COLUMN `updatedAt`,
    MODIFY `corridaId` VARCHAR(191) NOT NULL;
