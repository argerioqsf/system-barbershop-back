-- AlterTable
ALTER TABLE `users` ADD COLUMN `unitId` VARCHAR(191);

-- Copy the first linked unit for each user or fallback to any existing unit
SET @default_unit := (SELECT id FROM units LIMIT 1);
UPDATE `users` u
LEFT JOIN `user_units` uu ON uu.userId = u.id
SET u.unitId = COALESCE(uu.unitId, @default_unit)
WHERE u.unitId IS NULL;

-- Make the column required
ALTER TABLE `users` MODIFY `unitId` VARCHAR(191) NOT NULL;

-- Drop the junction table as it is no longer used
DROP TABLE `user_units`;

-- Create the foreign key after data migration
ALTER TABLE `users` ADD CONSTRAINT `users_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
