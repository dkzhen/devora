/*
  Warnings:

  - Added the required column `name` to the `ai_models` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owned_by` to the `ai_models` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ai_models` ADD COLUMN `created` INTEGER NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `owned_by` VARCHAR(191) NOT NULL;
