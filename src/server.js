import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { collectAllFeeds } from './collectors/rss.js';
import { processWithAI } from './ai/gemini.js';
import { sendNewsletter } from './email/sender.js';
import { listNewsletters, loadNewsletter, saveNewsletter } from './email/storage.js';
import { loadConfig, saveConfig, isValidCron } from './config/storage.js';

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3002;

// Armazena referência do cron job para poder atualizar
let currentCronJob = null;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// ============================================
// ADMIN AUTH MIDDLEWARE
// ============================================

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Autenticação requerida' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUser && password === adminPass) {
        next();
    } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
}

// ============================================
// NEWSLETTER ENDPOINTS
// ============================================

app.get('/api/newsletter/latest', async (req, res) => {
    try {
        const newsletters = await listNewsletters();

        if (newsletters.length === 0) {
            return res.status(404).json({
                error: 'Nenhuma newsletter encontrada',
                message: 'Execute primeiro a geração de newsletter'
            });
        }

        const latestDate = newsletters[0].replace('.json', '');
        const newsletter = await loadNewsletter(latestDate);

        res.json(newsletter);
    } catch (error) {
        console.error('Erro ao buscar newsletter:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/newsletter/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const newsletter = await loadNewsletter(date);

        if (!newsletter) {
            return res.status(404).json({ error: 'Newsletter não encontrada', date });
        }

        res.json(newsletter);
    } catch (error) {
        console.error('Erro ao buscar newsletter:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/newsletters', async (req, res) => {
    try {
        const newsletters = await listNewsletters();
        res.json({
            newsletters: newsletters.map(f => f.replace('.json', '')),
            count: newsletters.length
        });
    } catch (error) {
        console.error('Erro ao listar newsletters:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/newsletter/generate', async (req, res) => {
    try {
        console.log('\n🚀 Gerando nova newsletter via API...\n');

        const rawArticles = await collectAllFeeds();

        if (rawArticles.length === 0) {
            return res.status(404).json({
                error: 'Nenhum artigo encontrado',
                message: 'Nenhum artigo novo nas últimas 24h'
            });
        }

        const curatedData = await processWithAI(rawArticles);
        await saveNewsletter(curatedData, rawArticles);

        const config = await loadConfig();
        if (config.sendEmailOnGenerate) {
            await sendNewsletter(curatedData);
        }

        res.json({
            success: true,
            message: 'Newsletter gerada com sucesso!',
            stats: {
                rawArticles: rawArticles.length,
                highlights: curatedData.highlights.length,
                categories: {
                    launches: curatedData.categories.launches.length,
                    tutorials: curatedData.categories.tutorials.length,
                    discussions: curatedData.categories.discussions.length,
                    trends: curatedData.categories.trends.length
                }
            },
            data: curatedData
        });

    } catch (error) {
        console.error('Erro ao gerar newsletter:', error);
        res.status(500).json({ error: 'Erro ao gerar newsletter', message: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * POST /api/admin/login
 * Valida credenciais - retorna sucesso se auth header correto
 */
app.post('/api/admin/login', authMiddleware, async (req, res) => {
    const config = await loadConfig();
    res.json({
        success: true,
        message: 'Login realizado com sucesso',
        config
    });
});

/**
 * GET /api/admin/config
 * Retorna configuração atual
 */
app.get('/api/admin/config', authMiddleware, async (req, res) => {
    try {
        const config = await loadConfig();
        res.json(config);
    } catch (error) {
        console.error('Erro ao carregar config:', error);
        res.status(500).json({ error: 'Erro ao carregar configuração' });
    }
});

/**
 * PUT /api/admin/config
 * Atualiza configuração e reinicia cron se necessário
 */
app.put('/api/admin/config', authMiddleware, async (req, res) => {
    try {
        const { cronSchedule, timezone, sendEmailOnGenerate } = req.body;

        // Valida cron schedule
        if (cronSchedule && !isValidCron(cronSchedule)) {
            return res.status(400).json({
                error: 'Formato de cron inválido',
                example: '0 7 * * * (todo dia às 7h)'
            });
        }

        // Salva nova config
        const newConfig = await saveConfig({
            cronSchedule: cronSchedule || undefined,
            timezone: timezone || undefined,
            sendEmailOnGenerate: sendEmailOnGenerate !== undefined ? sendEmailOnGenerate : undefined
        });

        // Atualiza cron job se schedule mudou
        if (cronSchedule) {
            updateCronJob(newConfig.cronSchedule, newConfig.timezone);
        }

        console.log(`✅ Configuração atualizada: ${JSON.stringify(newConfig)}`);

        res.json({
            success: true,
            message: 'Configuração atualizada!',
            config: newConfig
        });

    } catch (error) {
        console.error('Erro ao atualizar config:', error);
        res.status(500).json({ error: 'Erro ao atualizar configuração' });
    }
});

// ============================================
// CRON JOB DINÂMICO
// ============================================

async function runScheduledNewsletter() {
    console.log('\n' + '='.repeat(70));
    console.log('🕐 CRON JOB - GERANDO NEWSLETTER AUTOMÁTICA');
    console.log('='.repeat(70) + '\n');

    const startTime = Date.now();

    try {
        const rawArticles = await collectAllFeeds();

        if (rawArticles.length === 0) {
            console.log('⚠️  Nenhum artigo novo encontrado. Newsletter cancelada.\n');
            return;
        }

        const curatedData = await processWithAI(rawArticles);
        await saveNewsletter(curatedData, rawArticles);

        // Verifica config para envio de email
        const config = await loadConfig();
        if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
            await sendNewsletter(curatedData);
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('='.repeat(70));
        console.log(`✨ NEWSLETTER CONCLUÍDA EM ${elapsed}s`);
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ ERRO NO CRON JOB:', error.message);
        console.error(error.stack);
    }
}

function updateCronJob(schedule, tz) {
    // Para o job atual
    if (currentCronJob) {
        currentCronJob.stop();
        console.log('⏹️  Cron job anterior parado');
    }

    // Inicia novo job
    currentCronJob = cron.schedule(schedule, runScheduledNewsletter, {
        timezone: tz || 'America/Sao_Paulo'
    });

    console.log(`⏰ Novo cron job agendado: ${schedule} (${tz})`);
}

// ============================================
// INICIALIZAÇÃO
// ============================================

async function init() {
    // Carrega config salva ou usa defaults
    const config = await loadConfig();
    const schedule = config.cronSchedule || process.env.CRON_SCHEDULE || '0 7 * * *';
    const timezone = config.timezone || process.env.TZ || 'America/Sao_Paulo';

    // Inicia cron job
    updateCronJob(schedule, timezone);

    // Inicia servidor
    app.listen(PORT, () => {
        console.log('\n📰 TECH NEWSLETTER - Production Server');
        console.log('━'.repeat(50));
        console.log(`🚀 API rodando em http://localhost:${PORT}`);
        console.log(`⏰ Cron agendado: ${schedule} (${timezone})`);
        console.log(`\nEndpoints públicos:`);
        console.log(`  GET  /api/health`);
        console.log(`  GET  /api/newsletters`);
        console.log(`  GET  /api/newsletter/latest`);
        console.log(`  GET  /api/newsletter/:date`);
        console.log(`  POST /api/newsletter/generate`);
        console.log(`\nEndpoints admin (requer auth):`);
        console.log(`  POST /api/admin/login`);
        console.log(`  GET  /api/admin/config`);
        console.log(`  PUT  /api/admin/config`);
        console.log('━'.repeat(50) + '\n');
    });
}

init();
