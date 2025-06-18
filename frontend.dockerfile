# Use the official Node.js 21 slim image as the base image
FROM node:22-slim AS base
RUN npm install -g turbo@^2.3.3

# Build Args
ARG VITE_WS_URL
ARG VITE_WEBRTC_URL
ARG VITE_BASE_URL
ARG VITE_WEBRTC_STREAMING

# Stage 1: Builder
FROM base AS builder
WORKDIR /app
COPY apps/frontend ./apps/frontend
COPY libs ./libs
COPY package.json package-lock.json ./
RUN turbo prune frontend --docker

# Stage 2: Installer
FROM base AS installer
ARG SHARED_TOKEN

WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/full/ .
COPY .npmrc .

# ENV Vars
ENV SHARED_TOKEN=$SHARED_TOKEN
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_WEBRTC_STREAMING=$VITE_WEBRTC_STREAMING
ENV VITE_WEBRTC_URL=$VITE_WEBRTC_URL
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Build Frontend
COPY apps/frontend/turbo.json apps/frontend/vite.config.ts .
RUN npm install
RUN npx turbo build --filter=frontend

# Stage 3: Runner
FROM nginx:1.25.4-alpine3.18

RUN apk add --no-cache bash

COPY --from=installer /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf
COPY apps/frontend/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

WORKDIR /app

RUN chown -R nginx:nginx /app && chmod -R 755 /app && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER root

EXPOSE 5173

ENTRYPOINT [ "bash", "/entrypoint.sh" ]
