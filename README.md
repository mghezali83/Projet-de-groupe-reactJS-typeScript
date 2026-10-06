# YTastyCrousty

## Description

Devoir de deuxième année d'informatique : création d'une API REST avec FastAPI. Le projet simule la gestion de trois restaurants fictifs Ytasty Crousty à Aix, Lyon et Paris, avec des produits, des commandes et différents rôles utilisateurs.

## Fonctionnalités

- Connexion par JWT, création des utilisateurs et rôles admin, staff et direction.
- Initialisation automatique des trois restaurants et du compte administrateur.
- Consultation des restaurants et modification de leurs informations par un administrateur.
- Recherche des produits avec filtres, création, modification, suppression et disponibilité.
- Commandes publiques, calcul du total côté serveur, suivi, statuts et annulation.
- Tableau cuisine staff avec gestion des commandes, disponibilité produit et mises à jour de suivi en temps réel par Socket.IO.
- Contrôle des accès par restaurant et documentation Swagger avec authentification Bearer.

## Technologies

Python (3.14.2 dans l'environnement local, 3.11 dans Docker), FastAPI et Uvicorn pour l'API ; PostgreSQL, SQLAlchemy et Psycopg pour les données ; Pydantic pour la validation ; Passlib avec PBKDF2-SHA256 et PyJWT pour l'authentification ; uv et Docker Compose pour l'installation.

## Pré-requis

Git, Docker et Docker Compose. Docker doit être démarré et les ports `8000` et `5432` disponibles. Python et les dépendances sont installés dans l'image Docker. Hors de Docker, installer aussi uv et utiliser `uv sync --locked` pour installer les dépendances.

## Installation et lancement

Commandes PowerShell :

```powershell
git clone https://github.com/paul23jj/YTastyCrousty.git
cd YTastyCrousty
cp .env.example .env
```

`cp .env.example .env` copie le fichier de configuration d'exemple vers un fichier personnel `.env`.

Renseigner `SECRET_KEY` dans `.env` avec une clé aléatoire privée d'au moins 32 caractères. Le compte administrateur local utilise l’identifiant `admin123` et le mot de passe configuré par `ADMIN_PASSWORD` (valeur de démonstration : `admin@123456`). Ne pas ajouter `.env` dans Git.

```powershell
docker compose up --build
```

La base PostgreSQL, les tables, les trois restaurants et l'administrateur sont initialisés automatiquement. Aucun script SQL n'est à exécuter manuellement. Les données sont conservées entre deux démarrages.

- [État de l'API](http://localhost:8000/health)
- [Swagger](http://localhost:8000/docs)
- [OpenAPI](http://localhost:8000/openapi.json)

Dans Swagger, utiliser `POST /auth/login` avec `admin123` et la valeur actuelle de `ADMIN_PASSWORD`, puis coller le token reçu dans **Authorize**. L’API initialise ou resynchronise le compte administrateur depuis cette variable au démarrage.

Les clients peuvent créer un compte avec `POST /auth/register`. Cette inscription publique ne permet pas de choisir un rôle privilégié. Les administrateurs connectés peuvent gérer les produits et les restaurants depuis l’interface.

Pour arrêter : `docker compose down`.

## Répartition des tâches

Nous avons réparti les tâches entre les membres du groupe. Nous travaillons sur des branches dédiées, puis intégrons les fonctionnalités sur `dev` pour les vérifier avant de les fusionner dans `main`.

## Contributeurs

- [Paul](https://github.com/Florian-AZ)
- [Harold](https://github.com/Emrick-R)
- [Leyth](https://github.com/Leyth07)