-- AlterTable
ALTER TABLE `api_keys` ADD COLUMN `rate_limit_rpd` INTEGER NULL,
    ADD COLUMN `rate_limit_rpm` INTEGER NULL;
