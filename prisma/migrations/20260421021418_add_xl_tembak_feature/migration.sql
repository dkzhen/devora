-- CreateTable
CREATE TABLE `xl_tembak_configs` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `msisdn` VARCHAR(191) NOT NULL,
    `env_token` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `xl_tembak_configs_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xl_tembak_purchases` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `package_id` VARCHAR(191) NOT NULL,
    `family_code` VARCHAR(191) NOT NULL,
    `msisdn` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `error_message` TEXT NULL,
    `purchased_at` DATETIME(3) NOT NULL,

    INDEX `xl_tembak_purchases_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `xl_tembak_configs` ADD CONSTRAINT `xl_tembak_configs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xl_tembak_purchases` ADD CONSTRAINT `xl_tembak_purchases_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
