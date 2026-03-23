# README - Déploiement Docker du projet

## 1. Présentation

Ce projet repose sur une architecture conteneurisée composée de :

- un **frontend**
- un **auth-service**
- un **product-service**
- un **order-service**
- une base **MongoDB dédiée par service**
- un **reverse proxy Nginx indépendant**

L’objectif de cette architecture est de séparer clairement :

- le **proxy d’entrée**
- les **applications**
- les **réseaux internes**
- les environnements **développement** et **production**

---

## 2. Architecture retenue

### Services applicatifs

- **frontend**
  - mode développement : serveur de dev Node/Vite
  - mode production : build statique servi par Nginx
- **auth-service**
  - service Node.js sur le port `3001`
- **product-service**
  - service Node.js sur le port `3000`
- **order-service**
  - service Node.js sur le port `3002`

### Bases de données

Chaque service possède sa propre instance MongoDB :

- `mongo-auth-*`
- `mongo-product-*`
- `mongo-order-*`

### Reverse proxy

Le reverse proxy est isolé dans son propre conteneur et dans son propre fichier Compose.  
Il sert de point d’entrée unique pour rediriger vers le frontend correspondant.

### Réseaux Docker

L’architecture réseau repose sur :

- `proxy` : réseau externe partagé entre le reverse proxy et les frontends
- `dev` : réseau interne de l’environnement de développement
- `prod` : réseau interne de l’environnement de production

### Logique réseau

- le **reverse proxy** communique uniquement avec les **frontends**
- les **frontends** communiquent avec les **API** sur leur réseau applicatif
- les **API** communiquent avec leur **MongoDB**
- les bases MongoDB ne sont pas exposées au reverse proxy

---

## 3. Structure attendue

```text
.
├── frontend/
│   ├── Dockerfile
│   └── ...
├── services/
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   └── ...
│   ├── product-service/
│   │   ├── Dockerfile
│   │   └── ...
│   └── order-service/
│       ├── Dockerfile
│       └── ...
├── infra/
│   ├── docker-compose.proxy.yml
│   └── nginx/
│       └── reverse-proxy.conf
├── docker-compose.apps.yml
└── README.md
```

---

## 4. Dockerfiles utilisés

### Frontend

Le frontend utilise un Dockerfile multi-stage :

- `base` : installation des dépendances
- `development` : exécution du serveur de développement
- `build` : génération du dossier `dist`
- `production` : service des fichiers statiques via Nginx

### Backend services

Chaque backend (`auth-service`, `product-service`, `order-service`) utilise un Dockerfile multi-stage :

- `base` : installation des dépendances
- `development` : exécution en mode développement
- `production` : exécution avec uniquement les dépendances nécessaires

---

## 5. Configuration des environnements

### Développement

En développement :

- le frontend tourne en mode dev
- les services backend tournent en mode dev
- les volumes sont montés pour refléter les modifications locales
- chaque service backend utilise sa propre base MongoDB de développement

### Production

En production :

- le frontend est buildé puis servi via Nginx
- les services backend tournent en mode production
- chaque service backend utilise sa propre base MongoDB de production
- aucun montage de code source n’est nécessaire

---

## 6. Réseau Docker externe pour le proxy

Avant le premier lancement, créer le réseau Docker partagé par le reverse proxy et les frontends :

```bash
docker network create proxy
```

Cette commande n’est à exécuter qu’une seule fois.

---

## 7. Lancement du reverse proxy

Le reverse proxy est géré indépendamment du reste du projet.

### Construire et démarrer le reverse proxy

```bash
docker compose -f infra/docker-compose.proxy.yml up -d --build
```

### Vérifier qu’il tourne

```bash
docker ps
```

---

## 8. Lancement des applications

Le projet applicatif est lancé via le fichier Compose dédié aux applications.

### Construire et démarrer tous les conteneurs applicatifs

```bash
docker compose -f docker-compose.apps.yml up -d --build
```

### Voir les logs

```bash
docker compose -f docker-compose.apps.yml logs -f
```

### Arrêter les applications

```bash
docker compose -f docker-compose.apps.yml down
```

### Arrêter le reverse proxy

```bash
docker compose -f infra/docker-compose.proxy.yml down
```

---

## 9. Résolution locale des domaines

Pour tester localement le reverse proxy avec des noms d’hôte dédiés, il faut déclarer les domaines dans le fichier `hosts`.

### Windows

Fichier :

```text
C:\Windows\System32\drivers\etc\hosts
```

### Linux / macOS

Fichier :

```text
/etc/hosts
```

### Entrées à ajouter

```text
127.0.0.1 app-dev.localhost
127.0.0.1 app.localhost
```

---

## 10. Exemple de configuration du reverse proxy

Exemple de bloc Nginx pour le frontend de développement :

```nginx
server {
    listen 80;
    server_name app-dev.localhost;

    location / {
        proxy_pass http://frontend-dev:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Exemple de bloc Nginx pour le frontend de production :

```nginx
server {
    listen 80;
    server_name app.localhost;

    location / {
        proxy_pass http://frontend-prod:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> **Attention :** le port indiqué dans `proxy_pass` doit correspondre au port réellement exposé à l’intérieur du conteneur frontend.

---

## 11. Étapes complètes d’exécution

### Étape 1 - Créer le réseau proxy

```bash
docker network create proxy
```

### Étape 2 - Démarrer le reverse proxy

```bash
docker compose -f infra/docker-compose.proxy.yml up -d --build
```

### Étape 3 - Démarrer les applications

```bash
docker compose -f docker-compose.apps.yml up -d --build
```

### Étape 4 - Vérifier les conteneurs

```bash
docker ps
```

### Étape 5 - Tester l’accès aux environnements

```text
http://app-dev.localhost:8081
http://app.localhost:8081
```

> Le port dépend du mapping défini dans le compose du reverse proxy.

---

## 12. Commandes utiles de test

### Vérifier les logs du proxy

```bash
docker compose -f infra/docker-compose.proxy.yml logs -f
```

### Vérifier les logs des applications

```bash
docker compose -f docker-compose.apps.yml logs -f
```

### Vérifier qu’un frontend répond

```bash
curl -I http://app-dev.localhost:8081
```

```bash
curl -I http://app.localhost:8081
```

### Vérifier qu’un service backend est bien démarré

```bash
docker compose -f docker-compose.apps.yml ps
```

### Entrer dans un conteneur applicatif

```bash
docker exec -it frontend-dev sh
```

```bash
docker exec -it auth-service-dev sh
```

```bash
docker exec -it product-service-dev sh
```

```bash
docker exec -it order-service-dev sh
```

### Vérifier la résolution réseau entre conteneurs

Depuis un frontend :

```bash
ping auth-service
ping product-service
ping order-service
```

> Les alias réseau doivent correspondre à ceux définis dans le fichier Compose.

---

## 13. Commandes de reconstruction

### Rebuild complet des applications

```bash
docker compose -f docker-compose.apps.yml up -d --build
```

### Rebuild complet du proxy

```bash
docker compose -f infra/docker-compose.proxy.yml up -d --build
```

### Reconstruction sans cache d’une image

```bash
docker build --no-cache -t nom-image .
```

---

## 14. Gestion des volumes

Les volumes sont utilisés pour :

- conserver les `node_modules` dans les environnements de développement
- persister les données MongoDB
- éviter de perdre les données après arrêt ou redémarrage des conteneurs

### Supprimer les conteneurs sans supprimer les volumes

```bash
docker compose -f docker-compose.apps.yml down
```

### Supprimer aussi les volumes

```bash
docker compose -f docker-compose.apps.yml down -v
```

> Cette commande supprime également les données MongoDB associées.

---

## 15. Bonnes pratiques appliquées

### 1. Séparation des responsabilités

- le reverse proxy est isolé dans sa propre stack
- les applications sont isolées dans leur propre stack
- les bases de données restent sur des réseaux internes

### 2. Multi-stage build

Les Dockerfiles utilisent plusieurs stages pour :

- limiter la taille des images finales
- séparer clairement le mode développement et le mode production
- éviter d’embarquer des outils inutiles en production

### 3. Réseaux dédiés

- `proxy` pour la communication entre le proxy et les frontends
- `dev` pour les communications internes de développement
- `prod` pour les communications internes de production

### 4. Isolation des bases de données

Les bases MongoDB ne sont jamais reliées au réseau du proxy.

### 5. Dépendances limitées en production

Les services backend en production installent uniquement les dépendances nécessaires avec :

```bash
npm install --omit=dev
```

### 6. Utilisation d’un utilisateur non-root

Les services backend de production utilisent :

```dockerfile
USER node
```

afin de limiter les risques liés à l’exécution en tant que root.

### 7. Frontend buildé en production

Le frontend de production est servi par Nginx, ce qui est plus léger et plus adapté qu’un serveur Node pour des fichiers statiques.

---

## 16. Points d’attention

### 1. Cohérence des ports

Il faut vérifier que :

- le port exposé dans le Dockerfile
- le port interne du service
- le port utilisé dans `proxy_pass`

sont bien cohérents.

### 2. Cohérence des noms de service

Dans la configuration Nginx, le nom utilisé dans `proxy_pass` doit être exactement le nom du service Docker accessible sur le réseau partagé.

### 3. Dépendances réseau

Le reverse proxy ne peut joindre que les conteneurs présents sur le réseau `proxy`.

### 4. Environnement frontend

Si le frontend communique avec les APIs via son propre réseau applicatif, alors il doit être relié à la fois :

- au réseau `proxy`
- et à son réseau d’application (`dev` ou `prod`)

---

## 17. Résumé rapide

### Initialisation

```bash
docker network create proxy
```

### Démarrer le proxy

```bash
docker compose -f infra/docker-compose.proxy.yml up -d --build
```

### Démarrer les applications

```bash
docker compose -f docker-compose.apps.yml up -d --build
```

### Accès

```text
http://app-dev.localhost:8081
http://app.localhost:8081
```

### Arrêt

```bash
docker compose -f docker-compose.apps.yml down
docker compose -f infra/docker-compose.proxy.yml down
```

---

## 18. Conclusion

Cette architecture permet :

- un déploiement Docker propre
- une séparation claire entre infrastructure et applications
- une gestion distincte du développement et de la production
- une meilleure lisibilité de l’architecture réseau
- une base saine pour une future mise en ligne sur VPS avec domaine et HTTPS

Pour une mise en production réelle sur serveur, il sera possible d’ajouter ensuite :

- la gestion TLS/HTTPS
- des sous-domaines réels
- des variables d’environnement sécurisées
- des healthchecks
- une supervision plus avancée