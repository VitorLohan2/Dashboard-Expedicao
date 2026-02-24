# ============================================
# Dockerfile - Dashboard Expedição Backend
# ============================================

# Stage 1: Build (instala todas as dependências)
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Stage 2: Produção (somente dependências de produção)
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

# Copia todo o código do builder
COPY --from=builder /app/config ./config
COPY --from=builder /app/models ./models
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/server ./server

# Porta padrão do backend
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD wget -q --spider http://127.0.0.1:3001/health || exit 1

CMD ["node", "server/index.js"]
