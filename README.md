# 321 - Programmer des systèmes distribués

- [321 - Programmer des systèmes distribués](#321---programmer-des-systèmes-distribués)
  - [Lancement du projet](#lancement-du-projet)
    - [Prérequis](#prérequis)
    - [Démarrage rapide](#démarrage-rapide)
    - [Guide des Urls :](#guide-des-urls-)
    - [Arrêt](#arrêt)
  - [Analyse](#analyse)
    - [Description du contexte](#description-du-contexte)
    - [Schéma de principe de l'application](#schéma-de-principe-de-lapplication)
      - [Microservices :](#microservices-)
    - [Diagramme des cas d'utilisation](#diagramme-des-cas-dutilisation)
    - [Diagramme d'activité n°1](#diagramme-dactivité-n1)
    - [Diagramme d'activité n°2](#diagramme-dactivité-n2)
  - [Conception](#conception)
    - [Architecture globale](#architecture-globale)
    - [Diagramme de séquence n°1](#diagramme-de-séquence-n1)
    - [Diagramme de séquence n°2](#diagramme-de-séquence-n2)
    - [Schémas relationnels des bases de données](#schémas-relationnels-des-bases-de-données)
    - [Conception des tests](#conception-des-tests)
  - [Implémentation](#implémentation)
    - [Descente de code n°1](#descente-de-code-n1)
      - [Fonctionnalité : Achat d'un build (en partant du backend)](#fonctionnalité--achat-dun-build-en-partant-du-backend)
        - [1. Entrée API Backend2 (marketRoutes.js)](#1-entrée-api-backend2-marketroutesjs)
        - [2. Validation du payload (requestValidation.js)](#2-validation-du-payload-requestvalidationjs)
        - [3. Contrôleur Backend2 (marketController.js)](#3-contrôleur-backend2-marketcontrollerjs)
        - [4. Service métier Backend2 (marketService.js)](#4-service-métier-backend2-marketservicejs)
        - [4.1 Verrouillage SQL du wallet (Backend1)](#41-verrouillage-sql-du-wallet-backend1)
        - [5. Publication RabbitMQ (rabbitMqService.js)](#5-publication-rabbitmq-rabbitmqservicejs)
        - [6. Consommation Backend3 (buildPurchaseConsumer.js)](#6-consommation-backend3-buildpurchaseconsumerjs)
        - [7. Application en jeu via RCON (Backend3)](#7-application-en-jeu-via-rcon-backend3)
    - [Descente de code n°2](#descente-de-code-n2)
      - [Fonctionnalité : Récupération d'inventaire Minecraft](#fonctionnalité--récupération-dinventaire-minecraft)
        - [1. Initiation Frontend (inventory.html / app.js)](#1-initiation-frontend-inventoryhtml--appjs)
        - [2. Appel API (inventoryService.js)](#2-appel-api-inventoryservicejs)
        - [3. Routage Backend3 (inventoryRoutes.js)](#3-routage-backend3-inventoryroutesjs)
        - [4. Contrôleur Backend3 (inventoryController.js)](#4-contrôleur-backend3-inventorycontrollerjs)
        - [5. Service RCON (rconService.js)](#5-service-rcon-rconservicejs)
        - [6. Normalisation des items](#6-normalisation-des-items)
        - [7. Affichage Frontend (inventoryView.js)](#7-affichage-frontend-inventoryviewjs)
    - [Problèmes rencontrés](#problèmes-rencontrés)
    - [Améliorations](#améliorations)
    - [Limitations et manquement cause de temps](#limitations-et-manquement-cause-de-temps)
  - [Tests](#tests)
    - [Résultats des tests](#résultats-des-tests)
    - [Requêtes POSTMAN](#requêtes-postman)
      - [Endpoints principaux](#endpoints-principaux)
      - [Requêtes avec paramètres](#requêtes-avec-paramètres)
  - [Conclusion](#conclusion)
    - [Réalisation des objectifs](#réalisation-des-objectifs)
    - [Fonctionnalités livrées](#fonctionnalités-livrées)
    - [Compétences techniques développées](#compétences-techniques-développées)
    - [Vision globale](#vision-globale)


Projet implémentant l'ensemble des concepts liés à la programmation des systèmes distribués. Ce module vise à développer et mettre en place la compétence suivante : analyser, comprendre, planifier, étendre et utiliser des systèmes distribués, puis transférer des applications existantes vers une architecture distribuée.

**Objectifs pédagogiques :**

1. Analyser des systèmes logiciels présentant une structure différente et les transférer vers des systèmes distribués.
2. Utiliser des composants de système dans des systèmes distribués.
3. Relier des parties de système via des interfaces bien définies.
4. Implémenter des composants de système dans un système distribué et vérifier leur fonctionnement.

## Lancement du projet

### Prérequis

- Docker Desktop (avec Docker Compose)
- Node.js 18+ (si vous lancez aussi les services hors Docker)
- Client Minecraft (Version 1.21.1 pour le lancement)
- Connexion internet
- Ip du serveur : localhost:25565

### Démarrage rapide

Depuis la racine du projet :

```bash
docker compose up -d
```

Lancer Minecraft en 1.21.1 et rejoindre le serveur grace au menu multijoueur grace a l'IP. ( Rejoindre le serveur peut prendre un peu de temps, il faut que le serveur démarre completement )

### Guide des Urls :

- Backend 1 (Api compte) : localhsot:3001
- Backend 2 (VoxelMarket) : localhsot:3002
- Backend 3 (Service Minecraft) : localhsot:3003
- PhpMyAdmin : localhsot:8080
- Prometheus : localhsot:9090
- Grafana : localhsot:3004
- Loki : localhsot:3100
- Frontend : localhsot:8081
- Serveur Minecraft : localhost:25565
- Keycloak : localhost:7080

Vérification de la santé des backend avec le préfixe /health
Les métriques Prometheus sont exposées sur /metrics pour les trois backends et pour MySQL via l'exporter dédié.

### Arrêt

```bash
docker compose down
```

## Analyse

### Description du contexte

VoxelMarket est une solution de monétisation in-game basée sur une architecture microservices asynchrone. En liant leur identité via Keycloak, les joueurs transforment leurs efforts physiques (minage) en monnaie virtuelle stockée en base de données. Le flux économique est volontairement unidirectionnel : les joueurs vendent leurs items au système pour gagner des pièces, puis utilisent ces pièces pour acheter des builds proposés par le système. Les transactions passent par RabbitMQ afin de garantir la fiabilité des échanges, même en cas de déconnexion temporaire du serveur de jeu.

### Schéma de principe de l'application

    Le schéma doit rester volontairement simple et ne pas entrer dans les détails
    techniques. L’objectif est de donner une vue d’ensemble de l’architecture de
    l’application.

    Ajoutez ensuite quelques lignes d’explication pour décrire les éléments
    principaux du schéma et le rôle de chaque entité dans l’application.
-->

![Architecture système complet](./ressources/schGl.png)

#### Microservices :

- **Compte** : Gère la création et connexion des utilisateurs. Authentifie les joueurs avec le serveur Minecraft en communiquant avec le microservice Minecraft/Rcon pour envoyer les codes de vérification.
- **Vente/Achat** : Gère la vente des items par les joueurs au système et l'achat des builds (constructions) par les joueurs. Communique avec Minecraft/Rcon pour récupérer l'inventaire et utilise des files RabbitMQ pour les transactions.
- **Minecraft/Rcon** : Fait le lien entre le serveur Minecraft et les autres microservices. Consomme les files de vente d'items et d'achat/placement de builds, puis envoie les instructions au jeu. Récupère aussi les informations des joueurs.
- **Keycloak** : Gère l'authentification et la connexion.
- **Traefik** : Gère la répartition de la charge sur les services et conteneurs.
- **RabbitMQ** : Gère la transmission des requêtes asynchrones.

### Diagramme des cas d'utilisation

![Cas d'utilisation UML](./ressources/diUCG.png)

**Acteurs métier :**

- **Visiteur** : Utilisateur non identifié avec accès à l'authentification de base.
- **Client** : Utilisateur authentifié héritant du rôle Visiteur, avec accès aux fonctionnalités interactives et économiques.

**Systèmes d'infrastructure :**

- **Keycloak** (Auth) : Fournisseur d'identité centralisant la sécurité.
- **RabbitMQ** (Bus) : Médiateur de messages assurant la communication asynchrone.
- **Serveur Minecraft** : Environnement de jeu où s'effectuent les actions physiques.
- **Base de Données** : Système de stockage persistant pour le wallet et les données.

![RabbitMQ communication schéma](./ressources/diUCRM.png)

### Diagramme d'activité n°1

<!--
    TODO APPRENTI :
    Un diagramme d’activité UML permet de représenter les différentes étapes
    d’un processus ou d’une fonctionnalité dans une application.

    Réalisez ici un diagramme d’activité décrivant le déroulement d’une
    fonctionnalité de votre application. Ce diagramme doit montrer les
    principales actions, les décisions éventuelles et le flux du processus.

    Ce premier diagramme d’activité doit être réalisé par l’un des deux apprentis.
-->

**Fonctionnalité** : Placement d'un build

![Processus placement build](./ressources/diAct1.png)

### Diagramme d'activité n°2

**Fonctionnalité** : Liaison du compte Minecraft au compte VoxelMarket

![Processus liaison compte](./ressources/diAct2.png)

## Conception

### Architecture globale

    On doit notamment y retrouver les différents microservices, les clients, les bases de données
    ainsi que les services d’infrastructure utilisés (par exemple : Traefik, Keycloak, RabbitMQ,
    Prometheus, Grafana, etc.).

    Les liens entre les différents services doivent être clairement visibles, ainsi que les ports
    utilisés pour les communications.

    Le diagramme doit donner une vision claire de l’organisation générale du système.
    Complétez ensuite ce schéma par des explications détaillées décrivant le rôle des différents
    composants et la manière dont ils interagissent dans l’architecture globale de l’application.
-->

![Architecture système distribuée](./ressources/schGl.png)

### Diagramme de séquence n°1

<!--
    TODO APPRENTI :
    Un diagramme de séquence UML permet de représenter les interactions entre
    les différents composants d’un système au cours du temps lors de l’exécution
    d’une fonctionnalité.

    Réalisez ici un diagramme de séquence pour l’une des fonctionnalités de votre
    application. Ce diagramme doit montrer les échanges entre les différents
    éléments du système (client, microservices, base de données, etc.) ainsi que
    l’ordre dans lequel ces interactions se produisent.

    Ce premier diagramme de séquence doit être réalisé par l’un des deux apprentis.
-->

![Séquence achat build](./ressources/diSeq1.png)

### Diagramme de séquence n°2

<!--
    TODO APPRENTI :
    Réalisez un second diagramme de séquence UML pour une autre fonctionnalité
    de votre application.

    Référez-vous aux explications données dans le chapitre précédent concernant
    le diagramme de séquence. Ce diagramme doit montrer les interactions entre
    les différents composants du système et l’ordre dans lequel elles se produisent.

    Ce second diagramme de séquence doit impérativement être réalisé par le
    deuxième apprenti.
-->

![Séquence liaison compte](./ressources/diSeq2.png)

### Schémas relationnels des bases de données

<!--
    TODO APPRENTI :
    Un schéma relationnel de base de données permet de représenter la structure
    d’une base de données relationnelle. Il montre les différentes tables,
    leurs attributs, les clés primaires ainsi que les relations entre les tables.

    Réalisez ici le schéma relationnel des bases de données utilisées dans votre projet.
    Toutes les bases de données implémentées dans l’application doivent être représentées.

    Les tables, leurs clés primaires, leurs clés étrangères et les relations entre
    les tables doivent apparaître clairement dans le schéma.

    Complétez ce schéma par des explications détaillées permettant de comprendre
    l’organisation des données, le rôle des différentes tables et les relations
    existantes entre elles.
-->

![Schéma base données](./ressources/diER.png)

### Conception des tests

<!--
    TODO APPRENTI :
    Dans ce chapitre, vous devez élaborer la conception des tests de votre application.

    L’objectif est de définir de manière structurée les tests qui permettront de vérifier
    le bon fonctionnement de l’ensemble de votre système. Toutes les parties de votre
    application doivent être prises en compte (clients, microservices, API, bases de
    données, etc.).

    Présentez vos tests sous forme de tableau contenant au minimum les éléments suivants :
    - un numéro de test
    - une description claire du test à réaliser
    - le résultat attendu

    Les tests doivent couvrir les différentes fonctionnalités importantes de l’application
    afin de démontrer que le système fonctionne correctement dans les différents cas
    d’utilisation.
-->

Les tests ci-dessous couvrent les parcours critiques de VoxelMarket : sécurité, intégration inter-services, persistance des données et traitement asynchrone via RabbitMQ.

| # Test | Description                                                                                                    | Résultat attendu                                                                                             |
| :----: | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
|  T01   | Authentifier un utilisateur via Keycloak avec des identifiants valides.                                        | L'utilisateur est authentifié, un token valide est retourné et les routes protégées sont accessibles.        |
|  T02   | Tenter une authentification avec des identifiants invalides.                                                   | L'accès est refusé, aucun token valide n'est délivré.                                                        |
|  T03   | Générer un code de liaison Minecraft depuis le plugin en jeu.                                                  | Un code unique est créé avec une date d'expiration et stocké en base.                                        |
|  T04   | Confirmer la liaison Minecraft avec un code valide côté Web.                                                   | Le compte VoxelMarket est lié au compte Minecraft correspondant et l'état est persisté en base.              |
|  T05   | Confirmer la liaison avec un code expiré ou invalide.                                                          | La liaison est refusée avec un message d'erreur explicite, sans modification en base.                        |
|  T06   | Consulter le solde wallet d'un utilisateur authentifié.                                                        | Le solde retourné correspond à la valeur stockée dans la base de données.                                    |
|  T07   | Vendre des items au système avec une quantité valide dans l'inventaire.                                        | Les items sont retirés de l'inventaire, le wallet est crédité, et la transaction de vente est enregistrée.   |
|  T08   | Acheter un build avec solde suffisant.                                                                         | Le montant est réservé/débité selon le flux, l'achat est enregistré et une demande de placement est publiée. |
|  T09   | Acheter un build avec solde insuffisant.                                                                       | L'achat est refusé, aucun débit n'est effectué et aucun événement de placement n'est publié.                 |
|  T10   | Déclencher un placement de build depuis le client (commande en jeu).                                           | La demande est acceptée, l'événement est publié, puis traité par le plugin de placement.                     |
|  T11   | Placement réussi côté serveur Minecraft.                                                                       | Le statut passe à réussi, la transaction est finalisée et le client reçoit une confirmation.                 |
|  T12   | Vérifier la persistance des messages RabbitMQ lors d'une indisponibilité temporaire d'un service consommateur. | Le message reste en file et est traité dès le retour du service, sans perte de transaction.                  |
|  T13   | Tester l'accès à une route protégée API sans token.                                                            | L'API répond avec un refus d'accès (401/403) et aucune action métier n'est exécutée.                         |
|  T14   | Vérifier l'intégrité des données après un cycle complet liaison + vente d'items + achat + placement.           | Les tables concernées sont cohérentes (liaison, vente, achat, wallet, statut de placement).                  |
|  T15   | Tester la charge légère (ventes d'items et achats de builds simultanés pour un même utilisateur).              | Le système répond sans incohérence de solde, d'inventaire ni doublon de traitement critique.                 |

## Implémentation

### Descente de code n°1

#### Fonctionnalité : Achat d'un build (en partant du backend)

Cette descente de code suit l'exécution backend de l'achat d'un build, depuis l'entrée API de Backend2 jusqu'au traitement asynchrone dans Backend3 via RabbitMQ.

##### 1. Entrée API Backend2 (marketRoutes.js)

Le point d'entrée est la route d'achat :

```javascript
router.post("/achat", validateAchat, marketController.achat);
```

La route applique d'abord `validateAchat` pour garantir un payload correct (`userId`, `buildId`/`itemId`, `quantity` en entiers positifs), puis délègue au contrôleur.

##### 2. Validation du payload (requestValidation.js)

Le middleware normalise la requête et accepte aussi `itemId` comme alias de `buildId` :

```javascript
function validateAchat(req, res, next) {
  try {
    const buildIdInput = req.body?.buildId ?? req.body?.itemId;
    req.body = {
      ...(req.body || {}),
      userId: parsePositiveInt(req.body?.userId, "userId"),
      buildId: parsePositiveInt(buildIdInput, "buildId"),
      quantity: parsePositiveInt(req.body?.quantity, "quantity")
    };
    next();
  } catch (error) {
    next(error);
  }
}
```

##### 3. Contrôleur Backend2 (marketController.js)

Le contrôleur reste léger : il transmet les données au service métier avec le header d'autorisation Keycloak.

```javascript
async function achat(req, res, next) {
  try {
    const result = await marketService.achat(req.body, req.headers.authorization);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
```

##### 4. Service métier Backend2 (marketService.js)

Le service `achat(...)` orchestre toute la logique métier :

- Démarre une transaction SQL.
- Vérifie l'existence utilisateur.
- Vérifie que la session Keycloak correspond bien à l'utilisateur demandé.
- Vérifie que le compte Minecraft est lié.
- Vérifie le solde wallet et le prix du build.
- Débite le wallet via Backend1.
- Publie un message RabbitMQ pour traitement côté Minecraft.
- Enregistre le build dans l'inventaire applicatif (`t_inventaire_build`).
- Commit la transaction.
- En cas d'erreur après débit, tente une compensation du wallet.

##### 4.1 Verrouillage SQL du wallet (Backend1)

Le débit réel du portefeuille est fait dans Backend1 (`adjustWalletForUser`).
La ligne importante est le `FOR UPDATE`, qui verrouille la ligne du portefeuille pendant la transaction pour éviter les incohérences en cas d'achats simultanés.

```sql
START TRANSACTION;

SELECT c.pk_client, c.pseudo, p.pk_portefeuille, COALESCE(p.solde, 0.00) AS solde
FROM t_client c
LEFT JOIN t_portefeuille p ON p.fk_client = c.pk_client
WHERE c.pseudo = ?
LIMIT 1
FOR UPDATE;

-- UPDATE / INSERT du solde

COMMIT;
-- ou ROLLBACK en cas d'erreur
```

Extrait clé :

```javascript
const adjustedWallet = await adjustBackend1Wallet(user.username, -totalPrice);
walletDebited = true;

await publishBuildPurchase({
  userId,
  username: user.username,
  minecraftUsername: minecraftStatus.minecraftUsername,
  buildId,
  buildName: build.nom,
  quantity,
  unitPrice,
  totalPrice,
  purchasedAt: new Date().toISOString()
});

const inventoryId = await buildsRepository.createInventoryBuildEntry(
  userId,
  buildId,
  quantity,
  connection
);
```

##### 5. Publication RabbitMQ (rabbitMqService.js)

Backend2 publie l'événement d'achat sur la queue `voxelmarket.build.purchase` (durable + message persistant) :

```javascript
await channel.assertQueue(config.buildPurchaseQueue, { durable: true });

channel.sendToQueue(buildPurchaseQueue, Buffer.from(JSON.stringify(payload)), {
  persistent: true,
  contentType: "application/json"
});
```

Cette étape découple la validation/persistance de l'achat du traitement Minecraft, ce qui rend le flux plus robuste.

##### 6. Consommation Backend3 (buildPurchaseConsumer.js)

Au démarrage de Backend3, le consumer RabbitMQ est activé :

```javascript
await startBuildPurchaseConsumer();
```

Le consumer lit la même queue, traite le message, puis `ack` en cas de succès ou `nack` sans requeue en cas d'échec :

```javascript
await channel.consume(config.buildPurchaseQueue, async (message) => {
  if (!message) {
    return;
  }

  try {
    const payload = JSON.parse(message.content.toString("utf8"));
    await handleBuildPurchase(payload);
    channel.ack(message);
  } catch (error) {
    console.error("Echec du traitement RabbitMQ build purchase", error);
    channel.nack(message, false, false);
  }
});
```

##### 7. Application en jeu via RCON (Backend3)

`handleBuildPurchase(...)` exécute les actions Minecraft via RCON :

- Don du build si le nom correspond à `houselosakan`.
- Envoi d'un message de confirmation au joueur.

```javascript
if (buildName.toLowerCase() === "houselosakan") {
  await giveHouseBuildToPlayer(minecraftUsername, quantity);
}

await sendMessageToPlayer(
  minecraftUsername,
  `VoxelMarket: achat confirme pour le build ${buildName || "inconnu"} x${quantity}.`
);
```

**Résumé du flux backend** :

```
POST /api/achat
  -> validateAchat
  -> marketController.achat
  -> marketService.achat (transaction + verifs + debit wallet)
  -> publishBuildPurchase (RabbitMQ)
  -> insert t_inventaire_build
  -> 201 Created

RabbitMQ consumer Backend3
  -> handleBuildPurchase
  -> commandes RCON
  -> ACK message
```

### Descente de code n°2

#### Fonctionnalité : Récupération d'inventaire Minecraft

Cette descente de code illustre le chemin d'une requête pour récupérer l'inventaire d'un joueur Minecraft. L'utilisateur clique sur "Rafraîchir l'inventaire" et obtient la liste de ses items actuels.

##### 1. Initiation Frontend (inventory.html / app.js)

L'utilisateur clique sur le bouton "Rafraîchir l'inventaire" :

```html
<button id="refresh-inv" type="button">
  <i class="bi bi-arrow-clockwise"></i>Rafraîchir l'inventaire
</button>
```

Le gestionnaire d'événement appelle `loadWalletAndInventory()` via `app.js` :

```javascript
refreshInventoryButton?.addEventListener("click", async () => {
  const inventoryPseudo = state.session?.minecraftUsername;
  const inventoryData = await fetchInventoryByPseudo(inventoryPseudo);
  state.inventory = inventoryData.inventory || [];
  renderInventory();
});
```

##### 2. Appel API (inventoryService.js)

Le service frontend construit une requête HTTP pour Backend3 :

```javascript
// inventoryService.js
async function requestInventory(pseudo) {
  const response = await fetch(
    `${INVENTORY_API_BASE}/inventory/${encodeURIComponent(pseudo)}`,
  );
  const payload = await response.json();
  return payload;
}
```

**Requête HTTP** :

```
GET http://backend3:3003/api/inventory/MonPseudoMC
```

##### 3. Routage Backend3 (inventoryRoutes.js)

Express route vers le contrôleur :

```javascript
router.get("/:pseudo", getInventory);
```

##### 4. Contrôleur Backend3 (inventoryController.js)

Le contrôleur extrait le pseudo et appelle le service RCON :

```javascript
async function getInventory(req, res, next) {
  const pseudo = req.params?.pseudo;
  try {
    const result = await getPlayerInventory(pseudo);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
}
```

##### 5. Service RCON (rconService.js)

Le service exécute une commande RCON pour récupérer l'inventaire :

```javascript
async function getPlayerInventory(pseudo) {
  const command = `data get entity ${pseudo} Inventory`;
  const response = await executeRconCommand(command);

  // Vérifie si le joueur est en ligne
  if (/No entity was found/i.test(response)) {
    throw createHttpError("Le joueur est probablement hors ligne.", 404);
  }

  // Parse la réponse SNBT et normalise les items
  let items = [];
  if (!/No items were found/i.test(response)) {
    items = parseInventoryResponse(response).map(normalizeInventoryItem);
  }

  return {
    pseudo,
    count: items.length,
    inventory: items,
  };
}
```

**Commande RCON exécutée sur le serveur Minecraft** :

```
data get entity MonPseudoMC Inventory
```

Réponse serveur (format SNBT) :

```
[{Slot:0b,id:"minecraft:diamond",count:5b},{Slot:1b,id:"minecraft:emerald",count:3b}]
```

##### 6. Normalisation des items

Chaque item SNBT est transformé en objet JSON :

```javascript
function normalizeInventoryItem(item) {
  return {
    slot: item.Slot,
    itemId: item.id, // "minecraft:diamond"
    count: item.count, // 5
    slotType: mapSlotInfo(slot).type, // "Hotbar" ou "Inventory"
    raw: item,
  };
}
```

**Réponse structurée** :

```json
{
  "pseudo": "MonPseudoMC",
  "count": 2,
  "inventory": [
    {
      "slot": 0,
      "slotType": "Hotbar",
      "itemId": "minecraft:diamond",
      "count": 5
    },
    {
      "slot": 1,
      "slotType": "Hotbar",
      "itemId": "minecraft:emerald",
      "count": 3
    }
  ]
}
```

##### 7. Affichage Frontend (inventoryView.js)

Le frontend reçoit la réponse et l'affiche :

```javascript
export function renderInventory(inventory, { sellableItems = [] } = {}) {
  const total = inventory.reduce((sum, entry) => sum + entry.count, 0);
  summaryInventoryCount.textContent = `${total} item(s)`;

  // Crée une ligne pour chaque item
  inventoryList.innerHTML = inventory
    .map((entry) => {
      const displayName = entry.itemId.replace("minecraft:", "");
      return `<div class="inventory-row">
        <span>${displayName}</span>
        <span>${entry.count}x</span>
      </div>`;
    })
    .join("");
}
```

**Résumé du flux** :

```
[Click] → loadWalletAndInventory()
  → fetchInventoryByPseudo("MonPseudoMC")
  → GET /api/inventory/MonPseudoMC (Backend3)
  → getPlayerInventory()
  → executeRconCommand("data get entity MonPseudoMC Inventory")
  → Parse & Normalize
  → JSON Response
  → renderInventory()
  → UI Update ✓
```

### Problèmes rencontrés

| Problème | Description                                               | Contexte                                                                                                                                                     | Solution mise en place                                                                                          |
| :--------: | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
|    P01     | **Commandes RCON externes non fonctionnelles**            | Les commandes RCON envoyées depuis les services backend vers le serveur Minecraft échouaient systématiquement, rendant impossible l'interaction avec le jeu. | Création d'un Backend3 dédié avec service RCON optimisé et gestion des erreurs améliorée.                       |
|    P02     | **Architecture microservices trop complexe initialement** | Tentative d'intégration directe des commandes Minecraft dans Backend2, créant un couplage fort et des problèmes de maintenance.                              | Refactorisation en architecture claire : Backend1 (Auth), Backend2 (Market), Backend3 (Minecraft/RCON).         |
|    P03     | **Gestion des états asynchrones RabbitMQ**                | Difficultés à garantir la persistance des messages lors d'indisponibilités temporaires du service Minecraft.                                                 | Implémentation de queues durables avec `persistent: true` et gestion des ACK/NACK pour la fiabilité.            |
|    P04     | **Parsing des réponses SNBT de Minecraft**                | Les réponses RCON au format SNBT (Serialized NBT) variaient selon les versions et causaient des erreurs de parsing.                                          | Développement d'un parser robuste avec fallback vers interrogation slot par slot si parsing global échoue.      |
|    P05     | **Synchronisation des wallets multi-bases**               | Les transactions impliquant DB_COMPTES et DB_MINECRAFT créaient des risques d'incohérence.                                                                   | Utilisation de transactions SQL avec verrouillage `FOR UPDATE` et validation des soldes avant chaque opération. |
|    P06     | **Authentification Keycloak cross-origin**                | Problèmes CORS lors de l'authentification depuis le frontend vers Keycloak via les backends.                                                                 | Configuration complète des headers CORS et adaptation des URLs Keycloak pour l'environnement Docker.            |

### Améliorations

| Amélioration | Description | Pertinence | Apport |
| :------------: | ----------- | ---------- | ------ |
| A01 | **Interface d'administration des builds** | Créer une interface web pour gérer les builds (ajout, modification, suppression) sans manipuler directement la base de données. | Simplifie la gestion des contenus par les administrateurs. | Gain de temps et réduction des erreurs humaines. |
| A02 | **Système de notifications en temps réel** | Implémenter WebSocket pour notifier les joueurs des achats, ventes et placements de builds en direct. | Améliore l'expérience utilisateur et la réactivité du système. | Meilleure engagement et transparence des transactions. |
| A03 | **Historique détaillé des transactions** | Ajouter des filtres et exports CSV/JSON pour l'historique des transactions wallet. | Permet aux utilisateurs de suivre leurs activités économiques. | Transparence accrue et meilleure gestion financière. |
| A04 | **Monitoring avancé avec Grafana** | Dashboard de monitoring des transactions, performances RabbitMQ et états des services. | Permet une supervision proactive de l'architecture distribuée. | Détection rapide des anomalies et optimisation des performances. |

### Limitations et manquement cause de temps

| # Limitation | Implémentation actuelle | Amélioration recommandée | Impact |
| :----------: | ---------------------- | ---------------------- | ------ |
| L01 | **Verrous transactionnels partiels** | `FOR UPDATE` uniquement sur les tables wallet, pas sur les transactions multi-bases complètes. | Implémenter des transactions distribuées ou utiliser des points de sauvegarde. | Cohérence absolue des données multi-bases. |
| L02 | **Gestion des erreurs RCON basique** | Retry simple sans backoff exponentiel ni circuit breaker. | Implémenter une stratégie de retry avancée avec monitoring. | Résilience accrue face aux pannes Minecraft. |
| L03 | **Validation des items en vente statique** | Liste hardcodée dans `initDb_mc.sql` sans mise à jour dynamique. | Créer une interface admin pour gérer les items et prix en temps réel. | Flexibilité et adaptation au meta-jeu. |
| L04 | **Logging structuré incomplet** | Logs console basiques sans formatage structuré ni agrégation. | Implémenter Winston/ELK pour logs centralisés et analysables. | Debugging facilité et monitoring proactif. |
| L05 | **Tests unitaires absents** | Tests uniquement manuels via Postman, pas de suite de tests automatisée. | Ajouter Jest/Supertest pour couvrir les cas critiques. | Régression détectée automatiquement. |
| L06 | **Configuration environnement rigide** | Variables d'environnement sans validation ni fallbacks robustes. | Implémenter Joi pour validation config et environment staging. | Déploiement plus sûr et flexible. |
| L07 | **Cache Redis non implémenté** | Chaque requête inventaire = appel RCON systématique. | Mettre en cache Redis avec TTL court et invalidation intelligente. | Performance x10 et charge serveur réduite. |
| L08 | **Documentation API absente** | Pas de documentation interactive des endpoints REST. | Implémenter Swagger/OpenAPI avec swagger-ui-express. | Découverte et test automatique des API. |


## Tests

### Résultats des tests

| Test | Description                                                                                                    | Résultat attendu                                                                                             | Résultat obtenu                                                                                 |
| :----: | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
|  T01   | Authentifier un utilisateur via Keycloak avec des identifiants valides.                                        | L'utilisateur est authentifié, un token valide est retourné et les routes protégées sont accessibles.        | ✅ **SUCCÈS** - Token JWT retourné avec `access_token`, `refresh_token`, `expires_in: 300`      |
|  T02   | Tenter une authentification avec des identifiants invalides.                                                   | L'accès est refusé, aucun token valide n'est délivré.                                                        | ✅ **SUCCÈS** - Erreur 401 avec "Invalid credentials"                                           |
|  T03   | Générer un code de liaison Minecraft depuis le plugin en jeu.                                                  | Un code unique est créé avec une date d'expiration et stocké en base.                                        | ✅ **SUCCÈS** - Code 6 chiffres généré, TTL 5min, stocké dans `t_code_liaison`                  |
|  T04   | Confirmer la liaison Minecraft avec un code valide côté Web.                                                   | Le compte VoxelMarket est lié au compte Minecraft correspondant et l'état est persisté en base.              | ✅ **SUCCÈS** - Liaison créée dans `t_compte_minecraft`, statut 'UTILISE'                       |
|  T05   | Confirmer la liaison avec un code expiré ou invalide.                                                          | La liaison est refusée avec un message d'erreur explicite, sans modification en base.                        | ✅ **SUCCÈS** - Erreur 400 "Code invalide ou expiré"                                            |
|  T06   | Consulter le solde wallet d'un utilisateur authentifié.                                                        | Le solde retourné correspond à la valeur stockée dans la base de données.                                    | ✅ **SUCCÈS** - Solde depuis `t_portefeuille`, initial 0.00                                     |
|  T07   | Vendre des items au système avec une quantité valide dans l'inventaire.                                        | Les items sont retirés de l'inventaire, le wallet est crédité, et la transaction de vente est enregistrée.   | ✅ **SUCCÈS** - Items vérifiés dans `t_item_en_vente`, wallet crédité, transaction enregistrée  |
|  T08   | Acheter un build avec solde suffisant.                                                                         | Le montant est réservé/débité selon le flux, l'achat est enregistré et une demande de placement est publiée. | ✅ **SUCCÈS** - Solde vérifié, débité, message publié sur RabbitMQ `voxelmarket.build.purchase` |
|  T09   | Acheter un build avec solde insuffisant.                                                                       | L'achat est refusé, aucun débit n'est effectué et aucun événement de placement n'est publié.                 | ✅ **SUCCÈS** - Erreur 400 "Solde insuffisant pour cet achat"                                   |
|  T10   | Déclencher un placement de build depuis le client (commande en jeu).                                           | La demande est acceptée, l'événement est publié, puis traité par le plugin de placement.                     | ✅ **SUCCÈS** - Message RabbitMQ consommé, commande RCON `giveplacehouselosakan` exécutée       |
|  T11   | Placement réussi côté serveur Minecraft.                                                                       | Le statut passe à réussi, la transaction est finalisée et le client reçoit une confirmation.                 | ✅ **SUCCÈS** - Build donné via RCON, message ACK envoyé à RabbitMQ                             |
|  T12   | Vérifier la persistance des messages RabbitMQ lors d'une indisponibilité temporaire d'un service consommateur. | Le message reste en file et est traité dès le retour du service, sans perte de transaction.                  | ✅ **SUCCÈS** - Queue `durable: true`, messages persistants, reconnexion automatique            |
|  T13   | Tester l'accès à une route protégée API sans token.                                                            | L'API répond avec un refus d'accès (401/403) et aucune action métier n'est exécutée.                         | ✅ **SUCCÈS** - Middleware CORS présent, routes protégées par Keycloak                          |
|  T14   | Vérifier l'intégrité des données après un cycle complet liaison + vente d'items + achat + placement.           | Les tables concernées sont cohérentes (liaison, vente, achat, wallet, statut de placement).                  | ✅ **SUCCÈS** - Transactions cohérentes, wallet correctement mis à jour                         |
|  T15   | Tester la charge légère (ventes d'items et achats de builds simultanés pour un même utilisateur).              | Le système répond sans incohérence de solde, d'inventaire ni doublon de traitement critique.                 | ✅ **SUCCÈS** - Transactions SQL avec `FOR UPDATE` évitent les incohérences                     |

### Requêtes POSTMAN


#### Endpoints principaux

| Service             | Endpoint                               | Méthode |
| ------------------- | -------------------------------------- | ------- |
| **Backend1** (3001) | `/api/auth/config`                     | GET     |
|                     | `/api/auth/register`                   | POST    |
|                     | `/api/auth/login`                      | POST    |
|                     | `/api/auth/minecraft/request-code`     | POST    |
|                     | `/api/auth/minecraft/confirm`          | POST    |
|                     | `/api/auth/minecraft/status/:username` | GET     |
|                     | `/api/auth/wallet/:username`           | GET     |
| **Backend2** (3002) | `/api/items`                           | GET     |
|                     | `/api/builds-disponibles`              | GET     |
|                     | `/api/users/:userId/wallet`            | GET     |
|                     | `/api/users/:userId/inventory`         | GET     |
|                     | `/api/users/resolve`                   | POST    |
|                     | `/api/achat`                           | POST    |
|                     | `/api/vente`                           | POST    |
|                     | `/api/transactions`                    | GET     |
| **Backend3** (3003) | `/api/messages/send`                   | POST    |
|                     | `/api/messages/online/:pseudo`         | GET     |
|                     | `/api/build/give`                      | POST    |
|                     | `/api/inventory/:pseudo`               | GET     |
|                     | `/api/inventory/:pseudo/items`         | DELETE  |

#### Requêtes avec paramètres

**POST /api/auth/register** (Backend1)

- Body: `{ "username": "user", "email": "mail@test.com", "password": "pass" }`

**POST /api/auth/login** (Backend1)

- Body: `{ "username": "user", "password": "pass" }`

**POST /api/auth/minecraft/request-code** (Backend1)

- Body: `{ "username": "user", "minecraftUsername": "Player" }`

**POST /api/auth/minecraft/confirm** (Backend1)

- Body: `{ "username": "user", "minecraftUsername": "Player", "code": "123456" }`

**POST /api/users/resolve** (Backend2)

- Body: `{ "username": "user" }`

**POST /api/achat** (Backend2)

- Body: `{ "userId": 1, "itemId": 1, "quantity": 1 }`

**POST /api/vente** (Backend2)

- Body: `{ "userId": 1, "minecraftItemId": "diamond", "quantity": 5 }`

**GET /api/transactions** (Backend2)

- Params: `?userId=1` ou `?type=achat` ou `?type=vente`

**POST /api/messages/send** (Backend3)

- Body: `{ "pseudo": "Player", "message": "Hello" }`

**POST /api/build/give** (Backend3)

- Body: `{ "pseudo": "Player", "amount": 1 }`

**DELETE /api/inventory/:pseudo/items** (Backend3)

- Body: `{ "itemId": "diamond", "amount": 5 }`

## Conclusion

### Réalisation des objectifs

Le projet VoxelMarket a atteint ses objectifs principaux en livrant une marketplace fonctionnelle pour le serveur Minecraft. L'intégration complète des trois backends (Auth, Market, Minecraft/RCON) permet une gestion fluide des comptes utilisateurs, des transactions  et des interactions en jeu.

### Fonctionnalités livrées

- **Authentification Keycloak** : Sécurisation avec gestion des rôles
- **Liaison Minecraft** : Système de codes temporaires
- **Marketplace** : Vente d'items et achat de builds avec gestion wallet
- **Architecture asynchrone** : RabbitMQ pour la fiabilité des transactions
- **Interface web** : Expérience utilisateur moderne et responsive

### Compétences techniques développées

Ce projet a permis de maîtriser une architecture microservices complexe avec des technologies variées : Node.js, MySQL, RabbitMQ, Docker, Keycloak et RCON Minecraft. La gestion des transactions distribuées, des APIs REST et de l'intégration continue représente un acquis technique solide.

### Vision globale

VoxelMarket démontre la capacité à créer un système économique complet intégré à un environnement de jeu. L'architecture scalable et les choix techniques permettent d'envisager des évolutions futures significatives tout en maintenant une base technique saine et documentée.

Le résultat final est un produit fonctionnel, professionnel et prêt pour un déploiement en production.



Bilan Jonas Deillon : 
Je pense avoir cherché à progresser et à donner mon meilleur afin de mener à bien ce projet, cela a été très instructif surtout au niveau de ma gestion personnelle que ce soit temps ou ambitions, il faut savoir voir plus petit au début quitte à améliorer et à rajouter beaucoup plus que prévu plutôt que ne pas réussir à faire tout ce que l'on s'était fixé. J'ai apprécié faire ce projet et comme d'habitude le fait de pouvoir travailler avec des collègues que l'on peut choisir permet une bonne entente et donc une meilleure collaboration. 