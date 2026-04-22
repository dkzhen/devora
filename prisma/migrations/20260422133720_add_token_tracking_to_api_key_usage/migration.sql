-- AlterTable
ALTER TABLE `api_key_usages` ADD COLUMN `completion_tokens` INTEGER NULL DEFAULT 0,
    ADD COLUMN `prompt_tokens` INTEGER NULL DEFAULT 0,
    ADD COLUMN `total_tokens` INTEGER NULL DEFAULT 0;
