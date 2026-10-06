# Ytasty Crousty Frontend

Frontend React 19, TypeScript strict, Vite, Redux Toolkit et Material UI pour
l’API FastAPI du projet.

## Démarrage

Depuis ce dossier :

```powershell
npm install
npm run dev
```

L’API est attendue par défaut sur `http://localhost:8000`. Pour utiliser une
autre URL, créer un fichier `.env.local` :

```env
VITE_API_URL=http://localhost:8000
# Facultatif : par défaut, Socket.IO utilise la même origine que l’API.
VITE_SOCKET_URL=http://localhost:8000
```

Le backend doit autoriser l’origine Vite dans ses configurations CORS HTTP et
Socket.IO. Les origines locales `localhost:5173`, `127.0.0.1:5173`,
`localhost:4173` et `127.0.0.1:4173` sont activées dans
`../src/ytastycrousty/main.py`.

## Connexion et administration

- Connexion : `/login`
- Création d’un compte client : `/register`
- Administration des produits : `/admin/products`
- Administration des restaurants : `/admin/restaurants` (administrateur uniquement)
- Cuisine : `/cuisine` (personnel connecté, limité au restaurant associé au compte)
- Compte administrateur local initialisé par l’API : `admin123`
- Mot de passe local de démonstration : `admin@123456` (configuré par
  `ADMIN_PASSWORD` dans le `.env` backend).

Les images de produits sont saisies sous forme d’URL HTTP(S), conformément au
schéma FastAPI. L’API ne propose pas d’endpoint de téléversement de fichiers.
Les contrôles de rôle côté frontend améliorent la navigation ; l’API reste
l’autorité pour l’autorisation effective.

Les comptes créés depuis le formulaire public disposent uniquement du rôle
client. Le rôle administrateur ne peut être attribué que par le compte initial
configuré côté serveur.

## Commande client

- Catalogue : `/produits` (recherche `?q=`, catégorie et disponibilité)
- Panier : tiroir accessible depuis le header
- Validation : `/checkout`
- Suivi : `/suivi/{order_number}`

La commande est envoyée à `POST /orders` avec le restaurant actif, les
identifiants/quantités des produits, le mode `onsite` ou `takeaway` et les
coordonnées du client. Le suivi reçoit les changements de statut via Socket.IO
et conserve une interrogation périodique de `GET /orders/{order_number}` comme
solution de repli. Le panier est rattaché à un seul restaurant ; confirmer le
changement d’établissement avec un panier non vide l’efface.

Le tableau cuisine charge les commandes du restaurant lié au compte staff,
permet de faire avancer ou d’annuler une commande et de basculer rapidement la
disponibilité des produits. Les commandes encore en attente après 15 minutes
sont signalées visuellement.

## Architecture source

- `app/` : store Redux et hooks typés
- `core/theme/` : thème Material UI
- `features/auth/` : types métier, API, slice, connexion et garde de rôle
- `features/admin/products/` : modèles, accès API et interface CRUD produit
- `shared/` : client HTTP et configuration partagés
