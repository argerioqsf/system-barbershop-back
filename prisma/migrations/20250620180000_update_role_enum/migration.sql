-- Update role name column to enum type and rename model
ALTER TABLE `roles` MODIFY `name` ENUM('ADMIN','BARBER','CLIENT','ATTENDANT','MANAGER','OWNER') NOT NULL;
