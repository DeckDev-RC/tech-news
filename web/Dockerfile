FROM node:20-alpine AS builder

WORKDIR /app

# Copia package files
COPY web/package*.json ./

# Instala dependências
RUN npm ci

# Copia código fonte
COPY web/ ./

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
    location /api { \
        proxy_pass http://backend:3002; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
