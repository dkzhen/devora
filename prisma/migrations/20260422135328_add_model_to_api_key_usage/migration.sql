-- AlterTable
ALTER TABLE `api_key_usages` ADD COLUMN `model` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `api_key_usages_model_idx` ON `api_key_usages`(`model`);
