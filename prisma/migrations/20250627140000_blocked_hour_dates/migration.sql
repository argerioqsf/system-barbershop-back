-- AlterTable
ALTER TABLE `profile_blocked_hours` DROP COLUMN `dayHourId`, ADD COLUMN `startHour` DATETIME NOT NULL, ADD COLUMN `endHour` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `appointments` DROP COLUMN `hour`;
