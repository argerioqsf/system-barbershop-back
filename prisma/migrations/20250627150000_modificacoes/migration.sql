-- AlterTable
ALTER TABLE `profile_blocked_hours` MODIFY `startHour` DATETIME(3) NOT NULL,
    MODIFY `endHour` DATETIME(3) NOT NULL;
