FROM node:24.22.3-alpine
RUN apk add --no-cache bash jemalloc
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json ./api/package.json
COPY client/package.json ./client/package.json
COPY packages/data-provider/package.json ./packages/data-provider/package.json
COPY packages/data-schemas/package.json ./packages/data-schemas/package.json
COPY packages/api/package.json ./packages/api/package.json
COPY packages/chat/package.json ./packages/chat/package.json
COPY vendor/code ./vendor/code
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx turbo run build --filter=@librechat/backend && \
    npm prune --omit=dev --no-audit --no-fund && \
    npm cache clean --force && \
    mkdir -p /app/client/public/images /app/logs /app/uploads /app/skill /app/data /app/api/logs && \
    chmod -R 777 /app/client/public/images /app/logs /app/uploads /app/skill /app/data /app/api/logs

ENV HOST=0.0.0.0
ENV PORT=7860
ENV NODE_ENV=production
ENV DOMAIN_CLIENT=https://yachat.bm-mohammed-samir.workers.dev
ENV DOMAIN_SERVER=https://yachat.bm-mohammed-samir.workers.dev
ENV ALLOW_REGISTRATION=true
ENV SEARCH=false
ENV TRUST_PROXY=1

EXPOSE 7860
CMD ["node", "api/server/index.js"]
