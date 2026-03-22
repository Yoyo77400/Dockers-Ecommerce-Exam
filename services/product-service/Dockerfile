FROM node:24-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
COPY . .
EXPOSE 3000
RUN npm install
CMD ["npm", "run", "dev"]

FROM base AS production
COPY . .
RUN npm install --omit=dev && npm cache clean --force
COPY src ./src
USER node
EXPOSE 3000
CMD ["npm", "start"]