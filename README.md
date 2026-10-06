# YTastyCrousty

## Description

Devoir de deuxième année d'informatique : création d'une API REST avec FastAPI. Le projet simule la gestion de trois restaurants fictifs Ytasty Crousty à Aix, Lyon et Paris, avec des produits, des commandes et différents rôles utilisateurs.

## Fonctionnalités

- Connexion par JWT, création des utilisateurs et rôles admin, staff et direction.
- Initialisation automatique des trois restaurants et du compte administrateur.
- Consultation des restaurants et modification de leurs informations par un administrateur.
- Recherche des produits avec filtres, création, modification, suppression et disponibilité.
- Commandes publiques, calcul du total côté serveur, suivi, statuts et annulation.
- Suivi client interactif par Socket.io : le statut est transmis en direct à la page de suivi.
- Contrôle des accès par restaurant et documentation Swagger avec authentification Bearer.

## Technologies

Python (3.14.2 dans l'environnement local, 3.11 dans Docker), FastAPI, Uvicorn et python-socketio pour l'API et les mises à jour temps réel ; PostgreSQL, SQLAlchemy et Psycopg pour les données ; Pydantic pour la validation ; Passlib avec PBKDF2-SHA256 et PyJWT pour l'authentification ; uv et Docker Compose pour l'installation.

## Pré-requis

Git, Docker et Docker Compose. Docker doit être démarré et les ports `8000` et `5432` disponibles. Python et les dépendances sont installés dans l'image Docker. Hors de Docker, installer aussi uv et utiliser `uv sync --locked` pour installer les dépendances.

## Installation et lancement

Commandes PowerShell :

```powershell
git clone https://github.com/mghezali83/Projet-de-groupe-reactJS-typeScript.git
cd YTastyCrousty
cp .env.example .env
```

`cp .env.example .env` copie le fichier de configuration d'exemple vers un fichier personnel `.env`.

Renseigner `SECRET_KEY` dans `.env` avec une clé aléatoire privée d'au moins 32 caractères. Le compte administrateur local utilise l’identifiant `admin123` et le mot de passe configuré par `ADMIN_PASSWORD` (valeur de démonstration : `Admin@123456`). Ne pas ajouter `.env` dans Git.

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

## Socket.io — option B : suivi client interactif

Le serveur `python-socketio` (`AsyncServer` en mode ASGI) enveloppe l'application FastAPI. Uvicorn continue de lancer `ytastycrousty.main:app` sur le port `8000` : les routes HTTP existantes sont transmises à FastAPI et le chemin Socket.io est servi par le même processus. Le démarrage habituel `docker compose up --build` installe la dépendance Python depuis `uv.lock` et lance les deux services backend.

Quand `/suivi/:order_number` s'ouvre, le frontend se connecte puis émet `join_order_tracking` avec `{ "order_number": "..." }`. Le backend vérifie que la commande existe et place cette connexion dans le salon `order:{order_number}`. Chaque socket ne suit qu'une seule commande à la fois ; le serveur retire l'abonnement précédent lors d'un nouveau suivi et nettoie sa référence à la déconnexion.

Après qu'un changement de statut ou une annulation a été validé et enregistré en base, l'API émet `order_status_updated` uniquement vers le salon de cette commande, avec `{ "order_number": "...", "status": "preparing" }`. Le client vérifie la référence et le statut avant de mettre à jour le Stepper. Les modifications passent par les routes HTTP cuisine déjà existantes ; aucun nouvel endpoint HTTP n'est ajouté.

Le polling HTTP de la page de suivi reste actif toutes les dix secondes comme secours si le socket est indisponible. L'interface cuisine affiche également une alerte MUI pour les commandes encore `pending` depuis au moins dix minutes ; cette alerte est calculée sur toutes les commandes du restaurant, quel que soit le filtre d'affichage.

Pour lancer l'ensemble en local, démarrer le backend avec `docker compose up --build`, puis le frontend depuis `frontend/` avec `npm run dev`. Pour un démarrage backend hors Docker, installer les dépendances avec `uv sync --locked`, configurer `.env`, puis lancer `uv run uvicorn ytastycrousty.main:app --reload` depuis la racine du dépôt.

## Répartition des tâches

Nous avons réparti les tâches entre les membres du groupe. Nous travaillons sur des branches dédiées, puis intégrons les fonctionnalités sur `dev` pour les vérifier avant de les fusionner dans `main`.

## Contributeurs

- [Paul](https://github.com/Florian-AZ)
- [Harold](https://github.com/Emrick-R)
- [Leyth](https://github.com/Leyth07)
