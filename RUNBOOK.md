# VoxelMarket — Runbook & Documentation minimale

> Documentation opérationnelle (lancement, URLs, métriques, dashboard) du projet VoxelMarket.
> Pour la documentation fonctionnelle complète, voir [`README.md`](./README.md).

---

## 1. Lancement

### 1.1 Prérequis

- **Docker Desktop** (avec Docker Compose v2)
- **Node.js 18+** (uniquement si vous lancez un backend hors Docker)
- **Client Minecraft 1.21.1** (pour rejoindre le serveur de jeu)
- Connexion internet (tirage des images Docker la première fois)

### 1.2 Démarrage rapide

Depuis la **racine du projet** :

```bash
# Construire les images et démarrer tous les services en arrière-plan
docker compose up -d --build

# Suivre les logs en temps réel (optionnel)
docker compose logs -f

# Vérifier l'état des conteneurs
docker compose ps
```

> ⏳ Le premier démarrage peut prendre quelques minutes (tirage des images MySQL, Keycloak, PaperMC, etc.).
> Le service `api` (Backend1) attend que Keycloak et la base `db-client` soient healthy.

### 1.3 Arrêt

```bash
# Arrêter les conteneurs (conserve les volumes / données)
docker compose down

# Arrêter ET supprimer les volumes (reset complet des données)
docker compose down -v
```

### 1.4 Commandes utiles

| Action | Commande |
| ------ | -------- |
| Redémarrer un service | `docker compose restart <service>` (ex: `api`, `backend2`, `minecraft`, `node-exporter`) |
| Voir les logs d'un service | `docker compose logs -f <service>` |
| Reconstruire une image | `docker compose up -d --build <service>` |
| Ouvrir un shell dans un conteneur | `docker compose exec <service> sh` |
| Lister les volumes | `docker volume ls \| grep voxelmarket` |

---

## 2. URLs & endpoints

### 2.1 Interfaces utilisateur & outils

| Service | URL | Identifiants par défaut |
| ------- | --- | ----------------------- |
| **Frontend VoxelMarket** | http://localhost:8081 | — |
| **Keycloak (admin console)** | http://localhost:7080 | `admin` / `admin` |
| **PhpMyAdmin** (DBs MySQL) | http://localhost:8080 | `root` / `root` |
| **Prometheus** | http://localhost:9090 | — |
| **Grafana** | http://localhost:3004 | `admin` / `admin` |
| **Loki** (API logs) | http://localhost:3100 | — |
| **cAdvisor** (métriques conteneurs) | http://localhost:8085 | — |
| **RabbitMQ Management** | http://localhost:15672 | `guest` / `guest` |

### 2.2 Serveur de jeu

| Service | Adresse | Notes |
| ------- | ------- | ----- |
| **Minecraft Server** | `localhost:25565` | Version **1.21.1** (PaperMC) |
| **RCON** | `localhost:25575` | Mot de passe : `emf1234` |

### 2.3 APIs backends

| Backend | URL publique | Préfixe API | Santé | Métriques |
| ------- | ------------ | ----------- | ----- | --------- |
| **Backend1** — Auth / Comptes | http://localhost:3001 | `/api/auth/*` | `GET /health` | `GET /metrics` |
| **Backend2** — Vente / Achat | http://localhost:3002 | `/api/*` | `GET /health` | `GET /metrics` |
| **Backend3** — Minecraft / RCON | http://localhost:3003 | `/api/*` | `GET /health` | `GET /metrics` |

#### Endpoints principaux (rappel)

| Service | Endpoint | Méthode |
| ------- | -------- | :-----: |
| Backend1 | `/api/auth/login` | POST |
| Backend1 | `/api/auth/register` | POST |
| Backend1 | `/api/auth/wallet/:username` | GET |
| Backend1 | `/api/auth/minecraft/request-code` | POST |
| Backend1 | `/api/auth/minecraft/confirm` | POST |
| Backend2 | `/api/items` | GET |
| Backend2 | `/api/builds-disponibles` | GET |
| Backend2 | `/api/achat` | POST |
| Backend2 | `/api/vente` | POST |
| Backend2 | `/api/transactions` | GET |
| Backend3 | `/api/inventory/:pseudo` | GET |
| Backend3 | `/api/messages/send` | POST |
| Backend3 | `/api/build/give` | POST |

### 2.4 Bases de données MySQL

| Base | Conteneur | Port hôte | User | Password | Base |
| ---- | --------- | :-------: | ---- | -------- | ---- |
| Keycloak | `my-db` | 3306 | `keycloak` | `keycloak` | `keycloak` |
| Comptes (DB_COMPTES) | `db-client` | 3307 | `client_user` | `client_password` | `DB_COMPTES` |
| Minecraft (DB_MINECRAFT) | `db-minecraft` | 3308 | `market_user` | `market_password` | `DB_MINECRAFT` |

> PhpMyAdmin est configuré pour se connecter aux **3 bases** simultanément.

### 2.5 Bus asynchrone

| Composant | URL interne | Queue principale |
| --------- | ----------- | ---------------- |
| **RabbitMQ** | `amqp://guest:guest@rabbitmq:5672` | `voxelmarket.build.purchase` (durable, messages persistants) |

---

## 3. Métriques & observabilité

### 3.1 Prometheus

Prometheus (http://localhost:9090) scrape tous les services toutes les **15 secondes**.

#### Jobs Prometheus configurés (`config/monitoring/prometheus.yml`)

| Job Prometheus | Cible | Source | Scrappé ? |
| -------------- | ----- | ------ | :-------: |
| `voxelmarket-backend1` | `api:3000/metrics` | Backend1 (Node.js) | ✅ |
| `voxelmarket-backend2` | `backend2:3002/metrics` | Backend2 (Node.js) | ✅ |
| `voxelmarket-backend3` | `backend3:3003/metrics` | Backend3 (Node.js) | ✅ |
| `voxelmarket-mysql` | `mysql-exporter:9104/metrics` | MySQL (exporter) | ✅ |
| `voxelmarket-node` | `node-exporter:9100/metrics` | Hôte (CPU/RAM/disk) | ❌ *à ajouter* |

> ⚠️ **Action à faire** : le service **`node-exporter`** a été ajouté au `docker-compose.yml`
> (port `9100`, image `prom/node-exporter:v1.8.2`) mais n'est pas encore déclaré dans
> `prometheus.yml`. Pour l'activer, ajouter :
>
> ```yaml
>   - job_name: voxelmarket-node
>     metrics_path: /metrics
>     static_configs:
>       - targets:
>           - node-exporter:9100
> ```
>
> Puis recharger Prometheus : `curl -X POST http://localhost:9090/-/reload`.

#### Métriques clés exposées

- **Backends Node.js** (format `prom-client`) :
  - `http_requests_total{method,route,code}` — compteur de requêtes HTTP
  - `http_request_duration_seconds` — histogramme de latence
  - `process_cpu_seconds_total`, `process_resident_memory_bytes` — usage CPU/RAM
  - `nodejs_eventloop_lag_seconds` — latence de la boucle événementielle
  - `nodejs_active_handles_total`, `nodejs_heap_size_used_bytes`
- **MySQL** (mysqld-exporter) :
  - `mysql_up`, `mysql_threads_connected`
  - `mysql_global_status_queries`, `mysql_global_status_slow_queries`
  - `mysql_global_status_bytes_received`, `mysql_global_status_bytes_sent`
- **Hôte** (node-exporter, *si activé*) :
  - `node_cpu_seconds_total`, `node_memory_MemAvailable_bytes`
  - `node_filesystem_avail_bytes`, `node_network_*_bytes_total`

#### Règles d'alerte

Le fichier [`config/monitoring/rules/sli_slo.yml`](./config/monitoring/rules/sli_slo.yml) contient les règles SLI/SLO (disponibilité, latence, taux d'erreur, saturation).

### 3.2 Logs (Loki + Promtail)

- **Loki** (http://localhost:3100) : agrégateur de logs.
- **Promtail** : agent qui collecte automatiquement les logs de **tous les conteneurs Docker** (via `/var/run/docker.sock`).

Requêtes utiles depuis Grafana → Explore → datasource **Loki** :

```logql
# Tous les logs du backend1
{job="docker", container="backend1-client"}

# Logs d'erreur uniquement
{job="docker"} |= "error" or "ERROR" or "Error"

# Logs RabbitMQ / Backend3 (consommateur)
{job="docker", container="backend3-minecraft"}
```

### 3.3 Métriques conteneurs (cAdvisor)

**cAdvisor** (http://localhost:8085) expose les métriques d'usage ressources par conteneur :

- `container_cpu_usage_seconds_total{name=~".+"}`
- `container_memory_usage_bytes{name=~".+"}`
- `container_network_receive_bytes_total`, `container_network_transmit_bytes_total`

### 3.4 Métriques hôte (node-exporter)

**node-exporter** (port interne `9100`, exposé sur http://localhost:9100/metrics) :

- CPU par cœur : `node_cpu_seconds_total{cpu=...}`
- Mémoire : `node_memory_MemTotal_bytes`, `node_memory_MemAvailable_bytes`
- Disques : `node_filesystem_size_bytes`, `node_filesystem_avail_bytes`
- Réseau : `node_network_receive_bytes_total`, `node_network_transmit_bytes_total`
- Load average : `node_load1`, `node_load5`, `node_load15`

> Non scrapé par défaut — voir action en §3.1.

---

## 4. Dashboard Grafana

### 4.1 Accès

1. Ouvrir http://localhost:3004
2. Login : `admin` / `admin` (changement de mot de passe demandé au 1er login)
3. Le dashboard est **auto-provisionné** au démarrage de Grafana (pas d'import manuel).

### 4.2 Dashboard provisionné

| Élément | Valeur |
| ------- | ------ |
| **Dossier** | `VoxelMarket` |
| **Fichier source** | [`config/monitoring/grafana/provisioning/dashboards/voxelmarket-red-sre-nodejs.json`](./config/monitoring/grafana/provisioning/dashboards/voxelmarket-red-sre-nodejs.json) |
| **Datasource** | Prometheus (UID `${DS_PROMETHEUS}` injecté automatiquement) |
| **Rechargement** | toutes les 30 s (`updateIntervalSeconds`) |

### 4.3 Variables du dashboard

Le dashboard expose deux **variables** filtrantes :

| Variable | Description | Valeurs |
| -------- | ----------- | ------- |
| `$job` | Job Prometheus à superviser | `voxelmarket-backend1`, `voxelmarket-backend2`, `voxelmarket-backend3` |
| `$instance` | Instance (host:port) du service | liste auto-générée depuis Prometheus |

### 4.4 Panneaux principaux

- **Status Actuel** — `up{job=...}` → ONLINE / OFFLINE
- **Latence HTTP** — percentiles p50 / p95 / p99 par route
- **Débit (req/s)** — `rate(http_requests_total[1m])`
- **Taux d'erreur** — codes HTTP 4xx / 5xx
- **CPU & Mémoire** — par instance Node.js
- **Event loop lag** — santé de la boucle Node.js
- **Saturation MySQL** — connexions, slow queries, throughput

### 4.5 Visualiser les logs

Dans Grafana → **Explore** (icône boussole) :

1. Datasource : **Loki**
2. Saisir une requête LogQL (exemples en §3.2)
3. Corrélation avec les métriques : cliquer sur un point d'une courbe puis *"Go to Logs"* / *"Go to Explore for logs"*.

---

## 5. Health-checks rapides

```bash
# Tous les services applicatifs doivent répondre
curl -s http://localhost:3001/health
curl -s http://localhost:3002/health
curl -s http://localhost:3003/health

# Keycloak
curl -s http://localhost:7080/health/ready

# Prometheus
curl -s http://localhost:9090/-/ready

# Grafana
curl -s http://localhost:3004/api/health

# Exporters (lecture directe des métriques)
curl -s http://localhost:9104/metrics   # MySQL
curl -s http://localhost:9100/metrics   # node-exporter (hôte)
curl -s http://localhost:8085/metrics   # cAdvisor (conteneurs)
```

---

## 6. En cas de problème

| Symptôme | Vérification |
| -------- | ------------ |
| Frontend inaccessible | `docker compose ps frontend1` → `docker compose logs frontend1` |
| Backend1 ne démarre pas | Attendre que `my-keycloak` soit `healthy` (healthcheck ~70 s) |
| Promtail ne scrape pas les logs | Vérifier l'accès au socket Docker (`/var/run/docker.sock`) — requis sur Linux/WSL2 |
| Grafana vide | Vérifier que la datasource Prometheus est provisionnée et que `$DS_PROMETHEUS` est résolu |
| RabbitMQ "connection refused" | Attendre que le conteneur `rabbitmq` soit `healthy` avant `backend2` / `backend3` |
| Minecraft "Failed to bind to port" | Port 25565 déjà utilisé → `netstat -ano \| findstr :25565` (Windows) |
| `node-exporter` absent dans Prometheus | Job pas encore déclaré → voir action §3.1 |
| node-exporter "permission denied" sur `/proc`, `/sys` | Normal sous Windows/WSL2 — le service monte `host/proc` et `host/sys` ; vérifier la compatibilité de l'environnement |

---

*Dernière mise à jour : alignée sur `docker-compose.yml` à la racine du projet (inclut `node-exporter`).*
