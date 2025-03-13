FROM node:20-slim AS base

# Instalar dependências do sistema necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    openssl \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Configuração de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# ---- Construção da aplicação ----
FROM base AS builder

# Instalar dependências
RUN npm ci

# Copiar todo o código-fonte
COPY . .

# Buildar a aplicação
RUN npm run build

# ---- Imagem de produção ----
FROM base AS production

# Adicionar um usuário não-root para executar a aplicação
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodeuser \
    && mkdir -p /app/uploads \
    && chown -R nodeuser:nodejs /app

# Copiar os scripts de deployment
COPY deploy-configs/entrypoint.sh /entrypoint.sh
COPY deploy-configs/db-migrate.sh /db-migrate.sh

# Ajustar permissões
RUN chmod +x /entrypoint.sh /db-migrate.sh

# Copiar os arquivos de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expor porta
EXPOSE 5000

# Configurar volume para uploads
VOLUME ["/app/uploads"]

# Usuário não-root
USER nodeuser

# Configurar o entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Comando de inicialização padrão
CMD ["npm", "run", "start:prod"]