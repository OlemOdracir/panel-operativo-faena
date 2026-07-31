FROM node:24-alpine AS dependencies

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable \
  && corepack prepare pnpm@11.17.0 --activate

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN HUSKY=0 pnpm install --frozen-lockfile

FROM dependencies AS build

COPY apps/api apps/api
COPY packages/contracts packages/contracts
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

RUN pnpm --filter @faena/contracts build \
  && pnpm --filter @faena/api prisma:generate \
  && pnpm --filter @faena/api build \
  && pnpm --filter @faena/api --prod deploy /production/api

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /production/api ./
COPY --from=build --chown=node:node /workspace/apps/api/prisma ./prisma
COPY --from=build --chown=node:node /workspace/apps/api/prisma.config.ts ./prisma.config.ts

USER node
EXPOSE 3000

CMD ["node", "dist/main.js"]
