-- AlterTable
ALTER TABLE `users` ADD COLUMN `unitId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `user_units`;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
