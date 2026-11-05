-- DropIndex
DROP INDEX `idempotency_keys_key_userId_idx` ON `idempotency_keys`;

-- CreateIndex
CREATE INDEX `idempotency_keys_userId_key_idx` ON `idempotency_keys`(`userId`, `key`);
