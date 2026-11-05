/*
  Warnings:

  - A unique constraint covering the columns `[userId,key]` on the table `idempotency_keys` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `idempotency_keys_userId_key_key` ON `idempotency_keys`(`userId`, `key`);
