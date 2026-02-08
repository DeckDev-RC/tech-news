FROM node:20-alpine AS builder

WORKDIR /app

# Copia package files (contexto já é a pasta web/)
COPY package*.json ./

# Instala dependências
RUN npm ci

# Copia código fonte
COPY . ./

# Define variável de ambiente para build
ARG VITE_API_URL=http://localhost:3002
ENV VITE_API_URL=$VITE_API_URL

# Build da aplicação
RUN npm run build

# =====================================
# Imagem de produção com Nginx
# =====================================
FROM nginx:alpine

# Copia build para nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração nginx para SPA
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
