# Docker

Ce service utilise un **Dockerfile multi-stage** avec 3 stages :

- `base` : installe les dépendances
- `development` : lance le service en mode développement
- `production` : lance le service en mode production avec uniquement les dépendances nécessaires

## Dockerfile

```dockerfile
FROM node:20-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM base AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM node:20-bookworm-slim AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY src ./src
USER node
EXPOSE 3000
CMD ["npm", "start"]
```

## Développement

Build de l’image :

```bash
docker build --target development -t product-service-dev .
```

Lancement du conteneur :

```bash
docker run --rm -it -p 3000:3000 product-service-dev
```

Accès :

```text
http://localhost:3000
```

## Production

Build de l’image :

```bash
docker build --target production -t product-service-prod .
```

Lancement du conteneur :

```bash
docker run --rm -p 3000:3000 product-service-prod
```

Accès :

```text
http://localhost:3000
```

## Prérequis

- Docker installé
- un script `dev` dans `package.json`
- un script `start` dans `package.json`

## Remarque

Ce Dockerfile est adapté à un **service Node.js** exécuté directement en conteneur, avec un mode développement et un mode production séparés.