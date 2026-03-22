# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

# Docker

Ce projet utilise un **Dockerfile multi-stage** avec 4 stages :

- `base` : installe les dépendances Node.js
- `development` : lance le serveur de développement
- `build` : génère le dossier `dist`
- `production` : sert les fichiers buildés avec Nginx

## Dockerfile

```dockerfile
FROM node:20-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM base AS development
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]

FROM base AS build
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Développement

Build de l’image :

```bash
docker build --target development -t mon-app-dev .
```

Lancement du conteneur :

```bash
docker run --rm -it -p 8080:8080 mon-app-dev
```

Accès :

```text
http://localhost:8080
```

## Production

Build de l’image :

```bash
docker build --target production -t mon-app-prod .
```

Lancement du conteneur :

```bash
docker run --rm -p 8080:80 mon-app-prod
```

Accès :

```text
http://localhost:8080
```

## Prérequis

- Docker installé
- un script `dev` dans `package.json`
- un script `build` dans `package.json`
- un dossier `dist/` généré au build
- un fichier `nginx.prod.conf` qui gére la liaison avec les différents services

## Remarque

Ce Dockerfile est adapté à un **frontend buildé** puis servi par **Nginx** en production.