-- DropForeignKey
ALTER TABLE `_FeatureToPermission` DROP FOREIGN KEY `_FeatureToPermission_A_fkey`;
ALTER TABLE `_FeatureToPermission` DROP FOREIGN KEY `_FeatureToPermission_B_fkey`;

-- DropTable
DROP TABLE IF EXISTS `_FeatureToPermission`;
DROP TABLE IF EXISTS `features`;

-- AlterTable
ALTER TABLE `permissions`
  DROP COLUMN `name`,
  ADD COLUMN `action` VARCHAR(191) NOT NULL,
  ADD COLUMN `category` VARCHAR(191) NOT NULL,
  ADD UNIQUE INDEX `permissions_action_key`(`action`);
