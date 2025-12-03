-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,
    `prenom` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `motDePasse` VARCHAR(255) NOT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `etat` VARCHAR(20) NOT NULL DEFAULT 'actif',
    `roleId` INTEGER NOT NULL DEFAULT 1,
    `emailVerifie` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_roleId_idx`(`roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profils` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateurId` INTEGER NOT NULL,
    `adresse` VARCHAR(255) NULL,
    `ville` VARCHAR(100) NULL,
    `codePostal` VARCHAR(20) NULL,
    `pays` VARCHAR(100) NULL,
    `telephone` VARCHAR(20) NULL,
    `dateNaissance` DATETIME(3) NULL,
    `photo` VARCHAR(255) NULL,
    `preferences` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `profils_utilisateurId_key`(`utilisateurId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historique_connexions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateurId` INTEGER NOT NULL,
    `dateConnexion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adresseIp` VARCHAR(45) NOT NULL,
    `navigateur` VARCHAR(255) NULL,
    `systemeExploit` VARCHAR(100) NULL,
    `appareil` VARCHAR(100) NULL,
    `succesConnexion` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historique_connexions_utilisateurId_idx`(`utilisateurId`),
    INDEX `historique_connexions_dateConnexion_idx`(`dateConnexion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profils` ADD CONSTRAINT `profils_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historique_connexions` ADD CONSTRAINT `historique_connexions_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
