# Base image
FROM node:22-alpine3.20 AS base
RUN npm install -g turbo@2.5.4

# Stage 1: Prune dependencies for backend
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune --docker --scope=backend

# Stage 2: Install dependencies and build
FROM base AS builder
ARG SHARED_TOKEN
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY .npmrc .

ENV SHARED_TOKEN=$SHARED_TOKEN
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PRISMA_ENGINES_MIRROR=http://binaries.prisma.sh
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN npm install && npm install --workspace=@libraries/prisma-client @prisma/client
RUN npm install --workspace=backend @nestjs/cli
# Copy full source for build
COPY --from=pruner /app/out/full/ .
RUN npx turbo run build --filter=backend...
RUN npx turbo run prisma:generate --filter=backend...

# Stage 3: Runtime image
FROM base AS runner
WORKDIR /home/node/app
RUN apk add --no-cache libssl3 dumb-init ffmpeg bash
USER node

# Copy hoisted and local dependencies
COPY --from=builder --chown=node:node /app/node_modules /home/node/node_modules
COPY --from=builder --chown=node:node /app/apps/backend/node_modules ./node_modules

# Copy built app
COPY --from=builder --chown=node:node /app/apps/backend/dist ./dist
COPY --from=builder --chown=node:node /app/apps/backend/package.json .
COPY --from=builder --chown=node:node /app/libs /home/node/libs
COPY /libs/prisma ./prisma
COPY apps/backend/entrypoint.sh .

ENTRYPOINT ["./entrypoint.sh"]
