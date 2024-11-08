-- AlterTable
ALTER TABLE `order` ADD COLUMN `amount` INTEGER NULL,
    ADD COLUMN `curreny` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NULL,
    ADD COLUMN `stripePaymentId` VARCHAR(191) NULL;
