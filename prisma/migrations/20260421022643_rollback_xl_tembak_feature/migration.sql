/*
  Warnings:

  - You are about to drop the `xl_tembak_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `xl_tembak_purchases` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `xl_tembak_configs` DROP FOREIGN KEY `xl_tembak_configs_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `xl_tembak_purchases` DROP FOREIGN KEY `xl_tembak_purchases_user_id_fkey`;

-- DropTable
DROP TABLE `xl_tembak_configs`;

-- DropTable
DROP TABLE `xl_tembak_purchases`;
