# Ytasty Crousty Frontend

Application frontend React 19 et TypeScript strict avec Vite, Redux Toolkit, Axios et Material UI. Elle consomme l’API FastAPI du dépôt.

## Installation et lancement

Depuis ce dossier (`frontend/`) :

```powershell
npm install
npm run dev
```

L’API doit être démarrée séparément depuis la racine du dépôt. Le guide backend et le `.env.example` sont à la racine.

Commandes npm disponibles :

- `npm run dev` : serveur de développement Vite.
- `npm run build` : vérification TypeScript puis build Vite.
- `npm run lint` : Oxlint.
- `npm run preview` : prévisualisation du build.

## Variables d’environnement

Par défaut, l’API est `http://localhost:8000`. Pour la remplacer, créer `frontend/.env.local` :

```env
VITE_API_URL=http://localhost:8000
# Facultatif : par défaut, Socket.IO utilise la même origine que l’API.
VITE_SOCKET_URL=http://localhost:8000
```

Le backend autorise les origines locales `localhost:5173`, `127.0.0.1:5173`,
`localhost:4173` et `127.0.0.1:4173` pour HTTP et Socket.IO. Toute autre origine
doit être ajoutée à la configuration backend. Ne placez pas de secrets backend
dans les variables `VITE_*` : elles sont intégrées au bundle navigateur.

## Routes principales

| Route | Fonction | Accès |
|---|---|---|
| `/` | Choix du restaurant | Public |
| `/produits` | Catalogue, recherche, catégorie et disponibilité | Public |
| `/produit/:id` | Détail d’un produit de la carte du restaurant sélectionné | Public |
| `/checkout` | Création d’une commande sur place ou à emporter | Public |
| `/suivi/:order_number` | Consultation du suivi de commande | Public avec la référence |
| `/login`, `/register` | Connexion et inscription client | Public |
| `/admin/products` | Gestion des produits | Admin et staff, dans la limite restaurant du staff |
| `/admin/restaurants` | Création, modification et ouverture des restaurants | Admin |
| `/admin/orders` | Liste et traitement des commandes | Admin et staff ; direction en lecture seule |
| `/admin/users` | Liste des comptes et création de comptes privilégiés | Admin |
| `/cuisine` | Tableau de commandes et disponibilité des produits | Staff |

`/inscription` redirige vers l’inscription et `/connexion` vers la connexion.

## Authentification et rôles

Les comptes créés depuis le formulaire public ont le rôle `client`. L’API attribue les rôles privilégiés. La session JWT est restaurée depuis le stockage local du navigateur ; la vérification réelle des autorisations reste faite par le backend.

- `staff` gère les produits et commandes de son restaurant affecté.
- `direction` peut consulter les commandes autorisées par l’API, sans pouvoir changer leur statut.
- `admin` gère les produits, commandes, restaurants et utilisateurs.

L’interface utilisateurs utilise les seuls endpoints existants `GET /users` et `POST /users`. Elle ne propose pas de modification ou de suppression, car ces opérations ne sont pas exposées par le backend.
La liste peut contenir des comptes client ; la création par l’admin permet les rôles `admin`, `staff` et `direction` conformément au schéma backend.

## Commandes et actualisation

Le checkout envoie `POST /orders`. Les prix et disponibilités sont recalculés et vérifiés côté backend. La page `/admin/orders` utilise `GET /restaurants/{restaurant_id}/orders`, `PATCH /orders/{order_number}/status` et `POST /orders/{order_number}/cancel`. L’interface avance les statuts dans l’ordre de préparation prévu par ses actions et propose l’annulation avant le retrait. Le backend actuel ne valide pas cet enchaînement de statuts lors d’un appel direct à son endpoint.

Le projet implémente l’option B du cahier des charges : suivi client interactif avec Socket.IO. Le backend FastAPI est enveloppé par `python-socketio` dans le même processus ASGI/Uvicorn et le frontend utilise `socket.io-client`.

Sur `/suivi/:order_number`, le frontend émet `join_order_tracking` avec le numéro suivi. Le backend vérifie la commande et abonne uniquement ce socket au salon `order:{order_number}`. Après le commit d’un changement de statut ou d’une annulation par la cuisine, le backend émet `order_status_updated` dans ce salon avec `{ order_number, status }`. La page valide la commande et le statut reçus, met son Stepper à jour, puis retire ses listeners et ferme la connexion au démontage. En cas d’indisponibilité Socket.io, la page conserve son polling HTTP toutes les dix secondes.

L’écran `/admin/orders` récupère toutes les commandes du restaurant puis applique le filtre de statut localement afin de garder visibles les alertes. Une alerte MUI signale les commandes en attente depuis au moins dix minutes. Le tableau cuisine affiche une alerte après quinze minutes.

Pour démarrer le système, lancez le backend (Socket.IO est servi sur la même origine et le même port que l'API) avec `docker compose up --build` depuis la racine, puis, depuis `frontend/`, lancez `npm run dev`. Le client socket utilise `VITE_API_URL` comme origine par défaut ; les origines frontend autorisées sont `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:4173` et `http://127.0.0.1:4173`.

Le panier est limité à un restaurant et restauré après rechargement. Si le restaurant sélectionné change avec un panier non vide, l’application demande confirmation puis vide ce panier.

## Images et architecture

Les images de produits sont des URL HTTP(S). Le backend ne propose pas d’endpoint de téléversement.

- `app/` : store Redux et hooks typés.
- `core/theme/` : thème Material UI.
- `features/auth/` : session, connexion, inscription et garde de rôle.
- `features/restaurants/` : sélection et accès API des restaurants.
- `features/products/` : catalogue et détail produit.
- `features/cart/` : panier et persistance locale.
- `features/orders/` : checkout, suivi et accès API des commandes.
- `features/admin/` : écrans de gestion des produits, restaurants, commandes et utilisateurs.
- `shared/` : client Axios, configuration et composants communs.
