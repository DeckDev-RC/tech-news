# 📰 Tech Newsletter - Sistema de Curadoria Automática

Newsletter automática diária de tecnologia com curadoria por IA (Gemini).

## 🎯 O que faz?

1. **Coleta** artigos de múltiplas fontes RSS (HackerNews, Dev.to, Reddit, etc)
2. **Filtra** conteúdo das últimas 24 horas
3. **Processa** com Gemini AI (categoriza, resume, classifica relevância)
4. **Envia** email formatado com os melhores artigos
5. **Salva** JSON para dashboard futuro

## 🚀 Quick Start

### 1. Configuração Local

```bash
# Clone ou baixe o projeto
cd tech-newsletter

# Instale dependências
npm install

# Copie .env.example para .env
cp .env.example .env

# Configure as variáveis no .env
nano .env
```

### 2. Configure as Variáveis de Ambiente

Edite o arquivo `.env`:

```env
# Gemini API Key (gratuita)
# Pegue em: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=sua_key_aqui

# Gmail - Use App Password, NÃO a senha normal!
# Como gerar: https://myaccount.google.com/apppasswords
GMAIL_USER=seu.email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Email de destino
RECIPIENT_EMAIL=onde.receber@email.com
RECIPIENT_NAME=Seu Nome

# Horário (0 7 * * * = todo dia às 7h)
CRON_SCHEDULE=0 7 * * *

# Timezone
TZ=America/Sao_Paulo
```

### 3. Teste Rápido (só RSS)

```bash
npm test
```

Isso vai coletar os feeds RSS e mostrar uma amostra, **sem enviar email**.

### 4. Executar Newsletter Completa (AGORA)

```bash
npm start -- --now
```

Isso vai:
- ✅ Coletar feeds
- ✅ Processar com Gemini
- ✅ Salvar JSON
- ✅ Enviar email

### 5. Rodar em Modo Cron (agendado)

```bash
npm start
```

Sistema ficará rodando e executará automaticamente todo dia às 7h.

## 📦 Deploy no EasyPanel (VPS)

### 1. Prepare o código

```bash
# Compacte o projeto
cd /caminho/para/tech-newsletter
tar -czf tech-newsletter.tar.gz .
```

### 2. No EasyPanel

1. **Create Service** → **App**
2. **Source**: Upload ou Git
3. **Build**: Dockerfile
4. **Environment Variables**: Adicione todas do `.env`

### 3. Configure Variáveis de Ambiente no EasyPanel

```
GEMINI_API_KEY=sua_key
GMAIL_USER=seu.email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
RECIPIENT_EMAIL=destino@email.com
RECIPIENT_NAME=Seu Nome
CRON_SCHEDULE=0 7 * * *
TZ=America/Sao_Paulo
```

### 4. Deploy!

O container vai iniciar e executar automaticamente todo dia às 7h.

## 📊 Estrutura de Arquivos

```
tech-newsletter/
├── src/
│   ├── collectors/
│   │   └── rss.js          # Coleta RSS feeds
│   ├── ai/
│   │   └── gemini.js       # Processamento com IA
│   ├── email/
│   │   ├── sender.js       # Envio de email
│   │   └── storage.js      # Salva JSON
│   ├── templates/
│   │   └── email.js        # Template HTML
│   ├── index.js            # Orquestrador principal
│   └── test.js             # Script de teste
├── data/
│   └── newsletters/        # JSONs salvos (YYYY-MM-DD.json)
├── .env.example            # Template de configuração
├── Dockerfile
├── package.json
└── README.md
```

## 🔧 Comandos Úteis

```bash
# Teste só a coleta RSS (rápido)
npm test

# Executa newsletter AGORA (teste completo)
npm start -- --now

# Roda em modo cron (agendado)
npm start

# Modo desenvolvimento (auto-reload)
npm run dev
```

## 📝 Fontes de Conteúdo

O sistema coleta de:

- **HackerNews**: Frontpage
- **Dev.to**: Tags AI, React
- **Reddit**: r/programming, r/MachineLearning
- **GitHub**: Blog oficial
- **Vercel**: Blog oficial

Para adicionar mais fontes, edite `src/collectors/rss.js`.

## 🎨 Categorias

A IA organiza em:

- 🔥 **Highlights**: TOP 5 mais relevantes
- 🚀 **Lançamentos**: Produtos, features, versões
- 📚 **Tutoriais**: How-tos, guias práticos
- 💡 **Discussões**: Debates, opiniões técnicas
- 📊 **Tendências**: Análises de mercado

## 🔐 Segurança

- **Nunca** commite o arquivo `.env`
- Use **App Password** do Gmail, não a senha real
- Mantenha as API keys em segredo

## 🐛 Troubleshooting

### Email não chega?

1. Verifique se usou **App Password** (não senha normal)
2. Confira spam/lixeira
3. Veja os logs: `docker logs <container-id>`

### Gemini dá erro?

1. Verifique se a API key está correta
2. Teste em: https://aistudio.google.com/
3. Veja se não excedeu quota gratuita

### Sem artigos?

Normal! Alguns feeds podem estar lentos. Execute novamente mais tarde.

## 📈 Próximos Passos

1. ✅ Backend funcionando
2. 🔜 Dashboard React para visualizar histórico
3. 🔜 API REST para acessar newsletters salvas
4. 🔜 Filtros personalizados por tags

## 📄 Licença

MIT - Faça o que quiser!

## 👨‍💻 Autor

Renato @ savycore.com.br
