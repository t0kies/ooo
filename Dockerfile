FROM node:22-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY backend/ ./backend/
COPY frontend/ ./frontend/

ENV NODE_ENV=production
EXPOSE 8080

HEALTHCHECK --interval=60s --timeout=15s --retries=2 \
  CMD wget -qO- http://localhost:${PORT:-8080}/healthz || exit 1

USER node

CMD ["node", "backend/app.js"]
