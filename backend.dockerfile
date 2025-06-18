# Base image
FROM node:22-alpine3.20 AS base
RUN npm install -g turbo@^2.3.3

# Stage 1: Prune dependencies for backend
FROM base AS pruner
WORKDIR /app
COPY apps/backend ./apps/backend
COPY libs ./libs
COPY package.json package-lock.json ./
RUN turbo prune --docker --scope=backend

# Stage 2: Install dependencies and build
FROM base AS builder
ARG SHARED_TOKEN
ENV SHARED_TOKEN=$SHARED_TOKEN
WORKDIR /app

# Copy minimal files needed to install deps
COPY .npmrc .
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/full/ .
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY apps/backend/turbo.json .
RUN npm install

# Copy full source for build
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
