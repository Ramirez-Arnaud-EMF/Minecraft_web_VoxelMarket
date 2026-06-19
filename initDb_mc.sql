create database IF NOT EXISTS DB_MINECRAFT;

USE DB_MINECRAFT;

CREATE TABLE
    t_compte_minecraft (
        pk_compte_mc INT PRIMARY KEY AUTO_INCREMENT,
        fk_client INT,
        pseudo_minecraft VARCHAR(16) NOT NULL
    );

CREATE TABLE
    t_code_liaison (
        pk_code INT PRIMARY KEY AUTO_INCREMENT,
        fk_client INT,
        valeur_code VARCHAR(10) NOT NULL,
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_expiration DATETIME NOT NULL,
        date_utilisation DATETIME,
        etat_code ENUM ('ACTIF', 'EXPIRE', 'UTILISE') DEFAULT 'ACTIF'
    );

CREATE TABLE
    t_build (
        pk_build INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(100) NOT NULL,
        categorie VARCHAR(50),
        description TEXT,
        prix_build DECIMAL(10, 2) NOT NULL
    );

CREATE TABLE
    t_inventaire_build (
        pk_inventaire INT PRIMARY KEY AUTO_INCREMENT,
        fk_client INT NOT NULL,
        fk_build INT NOT NULL,
        date_achat DATETIME DEFAULT CURRENT_TIMESTAMP,
        quantite_disponible INT DEFAULT 0,
        CONSTRAINT fk_inv_build FOREIGN KEY (fk_build) REFERENCES t_build (pk_build)
    );

CREATE TABLE
    t_placement_build (
        pk_placement INT PRIMARY KEY AUTO_INCREMENT,
        fk_client INT NOT NULL,
        fk_inventaire INT NOT NULL,
        monde VARCHAR(50),
        coord_x DOUBLE,
        coord_y DOUBLE,
        coord_z DOUBLE,
        date_demande DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_execution DATETIME,
        statut_placement ENUM ('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
        CONSTRAINT fk_place_inv FOREIGN KEY (fk_inventaire) REFERENCES t_inventaire_build (pk_inventaire)
    );

INSERT INTO t_build (nom, categorie, description, prix_build)
VALUES ('houselosakan', 'maison', 'petit maison en bois', 100);

CREATE TABLE
    t_item_en_vente (
        pk_item INT PRIMARY KEY AUTO_INCREMENT,
        item_id VARCHAR(100) NOT NULL,
        nom_affichage VARCHAR(100),
        prix_vente DECIMAL(10, 2) NOT NULL
    );

INSERT INTO t_item_en_vente (item_id, nom_affichage, prix_vente)
VALUES
    ('minecraft:dirt', 'Dirt', 0.50),
    ('minecraft:oak_log', 'Oak Log', 2.00),
    ('minecraft:oak_planks', 'Oak Planks', 0.75);