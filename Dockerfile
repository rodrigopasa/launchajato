FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependência primeiro para aproveitar o cache do Docker
COPY package*.json ./
RUN npm ci

# Copiar o restante dos arquivos
COPY . .

# Construir a aplicação
RUN npm run build

# Expor a porta
EXPOSE 5000

# Comando para executar a aplicação
CMD ["npm", "run", "start:prod"]