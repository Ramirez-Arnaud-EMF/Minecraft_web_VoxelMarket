# backend2 - Vente/Achat

Microservice Node.js pour gerer le flux metier suivant: les joueurs vendent des items au systeme pour obtenir des pieces, puis achetent des builds vendus par le systeme. La gestion des comptes est assuree par backend1.

## Prerequis

- Node.js 18+

## Installation

```bash
npm install
```

## Lancement

```bash
npm start
```

Par defaut, le service tourne sur le port `3002`.

## Lancement avec Docker

Depuis la racine du projet:

```bash
docker compose up --build -d
```

Verifier que le service tourne:

```bash
docker compose ps
```

Afficher les logs:

```bash
docker compose logs -f backend2
```

Arreter et supprimer les conteneurs:

```bash
docker compose down
```

Remise a zero complete (conteneur + volume SQLite):

```bash
docker compose down -v
```

## Frontend temporaire de test

Une mini interface de test est servie directement par le backend:

- `GET /` (page HTML)

Elle permet de tester rapidement:

- consultation du catalogue
- consultation wallet et inventaire
- vente d'items au systeme (`POST /api/vente`)
- achat de build (`POST /api/achat`)
- historique des transactions

Variables configurables dans `.env` (voir `.env.example`) :

- `PORT`
- `DB_PATH`

## Endpoints

### Sante

- `GET /health`

### Catalogue

- `GET /api/items`
- `GET /api/builds-disponibles`

### Wallet et inventaire

- `GET /api/users/:userId/wallet`
- `GET /api/users/:userId/inventory`

### Achat de build (joueur -> systeme)

- `POST /api/achat`

Body JSON:

```json
{
  "userId": 1,
  "itemId": 3,
  "quantity": 2
}
```

### Vente

- `POST /api/vente`

Cette route correspond a la vente d'items par le joueur au systeme (credit wallet).

Body JSON:

```json
{
  "userId": 1,
  "itemId": 3,
  "quantity": 1
}
```

### Transactions

- `GET /api/transactions`
- `GET /api/transactions?userId=1`
- `GET /api/transactions?type=achat`

## Donnees de depart

Au premier demarrage, la base SQLite est creee automatiquement avec :

- Utilisateurs: `steve` (1000), `alex` (700)
- Items: `Bois de chene`, `Pierre`, `Diamant`
