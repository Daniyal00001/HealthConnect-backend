-- CreateTable
CREATE TABLE `appointments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `clinic_id` BIGINT NOT NULL,
    `patient_user_id` BIGINT NOT NULL,
    `doctor_user_id` BIGINT NOT NULL,
    `created_by` BIGINT NULL,
    `scheduled_at` DATETIME(0) NOT NULL,
    `token_number` INTEGER NULL,
    `token_date` DATE NULL,
    `status` ENUM('scheduled', 'checked_in', 'in_consult', 'completed', 'cancelled') NULL DEFAULT 'scheduled',
    `payment_status` ENUM('unpaid', 'partial', 'paid') NULL DEFAULT 'unpaid',
    `notes` TEXT NULL,
    `extra` JSON NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_app_patient`(`patient_user_id`),
    INDEX `idx_appointments_clinic_date`(`clinic_id`, `token_date`, `token_number`),
    INDEX `idx_appointments_doctor_sched`(`doctor_user_id`, `scheduled_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clinic_sales` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `clinic_id` BIGINT NOT NULL,
    `appointment_id` BIGINT NULL,
    `patient_user_id` BIGINT NULL,
    `created_by` BIGINT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(10) NULL DEFAULT 'PKR',
    `payment_method` ENUM('cash', 'card', 'bank_transfer', 'mobile_wallet', 'other') NULL DEFAULT 'cash',
    `status` ENUM('pending', 'completed', 'refunded') NULL DEFAULT 'completed',
    `recorded_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `notes` TEXT NULL,

    INDEX `fk_sale_appointment`(`appointment_id`),
    INDEX `fk_sale_patient`(`patient_user_id`),
    INDEX `idx_sales_clinic_date`(`clinic_id`, `recorded_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clinic_token_counters` (
    `clinic_id` BIGINT NOT NULL,
    `token_date` DATE NOT NULL,
    `last_token` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`clinic_id`, `token_date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clinic_user_roles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `clinic_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `role_id` INTEGER NOT NULL,
    `assigned_by` BIGINT NULL,
    `assigned_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_cur_role`(`role_id`),
    INDEX `fk_cur_user`(`user_id`),
    UNIQUE INDEX `ux_clinic_user_role`(`clinic_id`, `user_id`, `role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clinics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `owner_user_id` BIGINT NULL,
    `phone` VARCHAR(30) NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_clinic_owner`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_profiles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `qualifications` VARCHAR(255) NULL,
    `specialization` VARCHAR(255) NULL,
    `license_no` VARCHAR(100) NULL,
    `bio` TEXT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,

    UNIQUE INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `front_desk_staff` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `shift` VARCHAR(100) NULL,
    `status` VARCHAR(50) NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `front_desk_staff_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient_profiles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `medical_record_no` VARCHAR(100) NULL,
    `blood_group` VARCHAR(10) NULL,
    `emergency_contact` JSON NULL,
    `extra` JSON NULL,

    UNIQUE INDEX `user_id`(`user_id`),
    UNIQUE INDEX `medical_record_no`(`medical_record_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NULL,
    `password_hash` VARCHAR(255) NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `dob` DATE NULL,
    `gender` ENUM('M', 'F', 'O') NULL,
    `extra` JSON NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `fk_app_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `fk_app_doctor` FOREIGN KEY (`doctor_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `fk_app_patient` FOREIGN KEY (`patient_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `clinic_sales` ADD CONSTRAINT `fk_sale_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `clinic_sales` ADD CONSTRAINT `fk_sale_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `clinic_sales` ADD CONSTRAINT `fk_sale_patient` FOREIGN KEY (`patient_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `clinic_token_counters` ADD CONSTRAINT `fk_tcounter_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `clinic_user_roles` ADD CONSTRAINT `fk_cur_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `clinic_user_roles` ADD CONSTRAINT `fk_cur_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `clinic_user_roles` ADD CONSTRAINT `fk_cur_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `clinics` ADD CONSTRAINT `fk_clinic_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `doctor_profiles` ADD CONSTRAINT `fk_doc_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `front_desk_staff` ADD CONSTRAINT `front_desk_staff_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `patient_profiles` ADD CONSTRAINT `fk_patient_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
