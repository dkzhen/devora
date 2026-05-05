-- AlterTable
ALTER TABLE `user_api_stats` ADD COLUMN `total_completion_tokens` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `total_prompt_tokens` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `total_tokens` INTEGER NOT NULL DEFAULT 0;
