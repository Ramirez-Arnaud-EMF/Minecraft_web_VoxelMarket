create database IF NOT EXISTS DB_COMPTES;
USE DB_COMPTES;

-- Création de la table t_client
CREATE TABLE t_client (
    pk_client INT PRIMARY KEY AUTO_INCREMENT,
    keycloak_sub VARCHAR(255) UNIQUE NOT NULL, -- Lien avec l'ID Keycloak
    pseudo VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut_compte VARCHAR(20)
);

-- Création de la table t_portefeuille (Wallet)
CREATE TABLE t_portefeuille (
    pk_portefeuille INT PRIMARY KEY AUTO_INCREMENT,
    fk_client INT NOT NULL,
    solde DECIMAL(10, 2) DEFAULT 0.00,
    date_maj DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_client FOREIGN KEY (fk_client) REFERENCES t_client(pk_client)
);