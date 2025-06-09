-- AlterTable
ALTER TABLE `leads` ADD COLUMN `course_modality` ENUM('presencial_100', 'online_100', 'semi_presencial') NULL,
    ADD COLUMN `education` ENUM('ensino_fundamental_incompleto', 'ensino_fundamental_completo', 'ensino_medio_incompleto', 'ensino_medio_completo', 'ensino_superior_incompleto', 'ensino_superior_completo', 'sem_escolaridade') NULL,
    ADD COLUMN `shift` ENUM('manha', 'tarde', 'noite', 'finais_de_semana') NULL;
