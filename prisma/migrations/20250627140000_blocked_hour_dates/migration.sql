-- AlterTable
ALTER TABLE `profile_blocked_hours` DROP FOREIGN KEY `profile_blocked_hours_dayHourId_fkey`;
ALTER TABLE `profile_blocked_hours` DROP COLUMN `dayHourId`, ADD COLUMN `startHour` DATETIME NOT NULL, ADD COLUMN `endHour` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `appointments` DROP COLUMN `hour`;
