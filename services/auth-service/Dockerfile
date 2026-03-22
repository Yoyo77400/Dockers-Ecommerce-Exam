FROM node:24-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
COPY . .
EXPOSE 3001
RUN npm install
CMD ["npm", "run", "dev"]

FROM base AS production
COPY . .
RUN npm install --omit=dev && npm cache clean --force
COPY src ./src
USER node
EXPOSE 3001
CMD ["npm", "start"]