FROM node:24-alpine AS dependencies

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN HUSKY=0 npm ci

FROM dependencies AS build

COPY apps/api apps/api

RUN npm run build --workspace=@faena/api

FROM node:24-alpine AS production-dependencies

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci --omit=dev --ignore-scripts --workspace=@faena/api --include-workspace-root

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-dependencies --chown=node:node /workspace/node_modules node_modules
COPY --from=production-dependencies --chown=node:node /workspace/apps/api/node_modules apps/api/node_modules
COPY --from=build --chown=node:node /workspace/apps/api/dist apps/api/dist
COPY --from=build --chown=node:node /workspace/apps/api/package.json apps/api/package.json

USER node
EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
