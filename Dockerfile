FROM node:20-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Instala dependências
RUN npm ci --omit=dev

# Copia código fonte
COPY src ./src

# Cria diretório de dados
RUN mkdir -p data/newsletters

# Variáveis de ambiente
ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
ENV PORT=3002

# Expõe a porta da API
EXPOSE 3002

# Healthcheck via API
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

# Comando padrão - servidor combinado (API + Cron)
CMD ["node", "src/server.js"]
