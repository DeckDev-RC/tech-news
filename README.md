# 📰 Tech Newsletter

Newsletter automática de tecnologia com curadoria por IA (Gemini).

## 🚀 Deploy no Easypanel

### 1. Configurar Repositório GitHub

```bash
git init
git add .
git commit -m "feat: prepare for deployment"
git remote add origin https://github.com/seu-usuario/tech-newsletter.git
git push -u origin main
```

### 2. Criar Serviços no Easypanel

#### Backend (API + Cron)

1. Crie um novo serviço **App** no Easypanel
2. Conecte ao repositório GitHub
3. Configure:
   - **Build Command**: (automático - usa Dockerfile)
   - **Port**: `3002`
   - **Path**: `/` (raiz do projeto)

4. Configure as **Environment Variables**:
   ```
   GEMINI_API_KEY=sua_key_aqui
   GMAIL_USER=seu.email@gmail.com
   GMAIL_APP_PASSWORD=senha_app
   RECIPIENT_EMAIL=destinatario@email.com
   RECIPIENT_NAME=Nome
   CRON_SCHEDULE=0 7 * * *
   TZ=America/Sao_Paulo
   PORT=3002
   ```

#### Frontend

1. Crie outro serviço **App**
2. Configure:
   - **Dockerfile Path**: `web/Dockerfile`
   - **Port**: `80`
   
3. Configure as **Environment Variables** de build:
   ```
   VITE_API_URL=https://sua-api.seu-dominio.com
   ```

### 3. Domínios

Configure os domínios no Easypanel:
- Backend: `api.seusite.com`
- Frontend: `newsletter.seusite.com`

---

## 🔧 Desenvolvimento Local

```bash
# Backend
npm install
npm run server:dev

# Frontend (outro terminal)
cd web
npm install
npm run dev
```

---

## 📡 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/newsletters` | Lista todas |
| GET | `/api/newsletter/latest` | Mais recente |
| GET | `/api/newsletter/:date` | Por data |
| POST | `/api/newsletter/generate` | Gera nova |

---

## ⏰ Cron Job

O backend executa automaticamente às **7h da manhã** (configurável via `CRON_SCHEDULE`).

O job:
1. Coleta feeds RSS (HackerNews, Dev.to, Reddit, GitHub, Vercel)
2. Processa com Gemini IA (curadoria + tradução)
3. Salva em JSON
4. Envia por email (se configurado)
