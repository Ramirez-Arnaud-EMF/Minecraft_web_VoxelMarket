# Minecraft RCON Web Controller

Interface web légère pour piloter un serveur Minecraft (Paper/Vanilla) via RCON.

Ce projet contient :
- un serveur Minecraft dans Docker (`itzg/minecraft-server`),
- une API Node.js/Express (`clientRcon`) pour exécuter des commandes RCON,
- une UI web simple pour lancer des commandes prédéfinies, des séquences, et des commandes personnalisées.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Arborescence](#arborescence)
- [Prérequis](#prérequis)
- [Démarrage rapide (Docker)](#démarrage-rapide-docker)
- [Exécution locale sans Docker (UI/API)](#exécution-locale-sans-docker-uiapi)
- [Configuration](#configuration)
- [API HTTP](#api-http)
- [Sécurité](#sécurité)
- [Dépannage](#dépannage)
- [Roadmap](#roadmap)
- [Contribution](#contribution)
- [Licence](#licence)

---

## Fonctionnalités

- Boutons pour commandes RCON prédéfinies (`op`, `deop`, `list`, `save-all`).
- Bouton de séquence multi-commandes avec exécution **séquentielle** (attend la réponse de chaque étape).
- Section “commande personnalisée” pour saisir et exécuter n’importe quelle commande RCON.
- Résultat de chaque exécution affiché en temps réel dans l’interface.
- Déploiement complet via `docker compose`.

---

## Architecture

- `minecraft` (conteneur Docker): serveur Minecraft + RCON activé.
- `clientrcon` (conteneur Docker): application Node.js/Express.
- `clientRcon/index.html` + `clientRcon/index.js`: frontend statique servi par Express.
- `clientRcon/controller.js`: routes API HTTP.
- `clientRcon/minecraft.js`: connexion RCON, commandes, séquences.

---

## Arborescence

```text
minecraftTest/
├─ docker-compose.yml
├─ data/                       # Données persistées du serveur Minecraft
└─ clientRcon/
   ├─ controller.js            # API Express
   ├─ minecraft.js             # Logique RCON
   ├─ index.html               # UI
   ├─ index.js                 # Logique frontend
   └─ package.json
```

---

## Prérequis

- Docker + Docker Compose
- (Optionnel, mode local API/UI) Node.js 20+

---

## Démarrage rapide (Docker)

Depuis la racine du projet :

```bash
docker compose up -d --build
```

Accès :
- UI RCON : http://localhost:3000
- Minecraft : `localhost:25565`
- RCON : `localhost:25575`

Arrêter :

```bash
docker compose down
```

Voir les logs :

```bash
docker compose logs -f minecraft
docker compose logs -f clientrcon
```

---

## Exécution locale sans Docker (UI/API)

Utiliser cette option uniquement si vous avez déjà un serveur Minecraft avec RCON actif.

```bash
cd clientRcon
npm install
npm start
```

Puis ouvrir : http://localhost:3000

---

## Configuration

### Variables côté API (`clientrcon`)

- `PORT` (défaut: `3000`)
- `RCON_HOST` (défaut: `127.0.0.1`)
- `RCON_PORT` (défaut: `25575`)
- `RCON_PASSWORD` (défaut dans le code actuel: `emf1234`)
- `MC_PLAYER` (défaut: `losakan`)

### Variables côté serveur Minecraft (`minecraft`)

Dans `docker-compose.yml` :
- `EULA=TRUE`
- `TYPE=PAPER`
- `VERSION=1.21.1`
- `ENABLE_RCON=true`
- `RCON_PORT=25575`
- `RCON_PASSWORD=...`

---

## API HTTP

Base URL : `http://localhost:3000`

### Commandes prédéfinies

- `GET /api/commands`
  - Retourne la liste des commandes disponibles.

- `POST /api/commands/:key`
  - Exécute une commande prédéfinie.

Exemple :

```bash
curl -X POST http://localhost:3000/api/commands/listPlayers
```

### Séquences prédéfinies

- `GET /api/sequences`
  - Retourne les séquences disponibles.

- `POST /api/sequences/:key`
  - Exécute la séquence **dans l’ordre**, en attendant chaque réponse.

Exemple :

```bash
curl -X POST http://localhost:3000/api/sequences/loadSurvivalBase
```

### Commande libre

- `POST /api/execute`
  - Body JSON: `{ "command": "say Hello" }`

Exemple :

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"command":"say Hello from API"}'
```

---

## Sécurité

⚠️ Important pour un dépôt public :

- Ne publiez jamais un vrai mot de passe RCON.
- Le mot de passe actuel (`emf1234`) est un exemple de dev local : changez-le immédiatement.
- N’exposez pas le port RCON (`25575`) sur Internet.
- Limitez l’accès à l’UI/API (reverse proxy + auth, VPN, firewall).
- Évitez d’exécuter des commandes sensibles depuis la section “commande libre” sans contrôle d’accès.

### Recommandations minimales

- Déplacer les secrets dans un fichier `.env` non versionné.
- Ajouter une authentification à l’API (token/session).
- Ajouter une liste blanche de commandes autorisées en production.

---

## Dépannage

### Le bouton ne fait rien / erreur 500

- Vérifier que Minecraft est `healthy` :

```bash
docker compose ps
```

- Vérifier les logs API :

```bash
docker compose logs --tail=100 clientrcon
```

- Vérifier la cohérence `RCON_PASSWORD` entre `minecraft` et `clientrcon`.

### Le serveur Minecraft ne démarre pas

- Vérifier `EULA=TRUE`.
- Vérifier les logs :

```bash
docker compose logs --tail=200 minecraft
```

---

## Roadmap

- Authentification de l’interface web.
- Historique des commandes exécutées.
- Validation/sanitation des commandes libres.
- Healthcheck HTTP pour `clientrcon` dans Compose.

---

## Contribution

1. Fork du repo
2. Créer une branche feature (`feat/ma-feature`)
3. Commit clair et atomique
4. Ouvrir une Pull Request avec contexte + tests manuels

Conventions recommandées :
- Garder les changements ciblés.
- Mettre à jour ce README si le comportement change.

---

## Licence

Aucune licence n’est définie actuellement.

Si vous rendez ce dépôt public, ajoutez un fichier `LICENSE` (ex: MIT) pour clarifier les droits d’utilisation.
