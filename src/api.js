import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { collectAllFeeds } from './collectors/rss.js';
import { processWithAI } from './ai/gemini.js';
import { listNewsletters, loadNewsletter, saveNewsletter } from './email/storage.js';

const app = express();
const PORT = process.env.API_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * GET /api/newsletter/latest
 * Retorna a newsletter mais recente salva
 */
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

/**
 * GET /api/newsletter/:date
 * Retorna newsletter de uma data específica (YYYY-MM-DD)
 */
app.get('/api/newsletter/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const newsletter = await loadNewsletter(date);

        if (!newsletter) {
            return res.status(404).json({
                error: 'Newsletter não encontrada',
                date
            });
        }

        res.json(newsletter);
    } catch (error) {
        console.error('Erro ao buscar newsletter:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/newsletters
 * Lista todas as newsletters disponíveis
 */
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

/**
 * POST /api/newsletter/generate
 * Gera uma nova newsletter (coleta RSS + processa com IA)
 */
app.post('/api/newsletter/generate', async (req, res) => {
    try {
        console.log('\n🚀 Gerando nova newsletter via API...\n');

        // 1. Coleta feeds
        const rawArticles = await collectAllFeeds();

        if (rawArticles.length === 0) {
            return res.status(404).json({
                error: 'Nenhum artigo encontrado',
                message: 'Nenhum artigo novo nas últimas 24h'
            });
        }

        // 2. Processa com IA
        const curatedData = await processWithAI(rawArticles);

        // 3. Salva
        await saveNewsletter(curatedData, rawArticles);

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
        res.status(500).json({
            error: 'Erro ao gerar newsletter',
            message: error.message
        });
    }
});

/**
 * GET /api/health
 * Health check
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log('\n📰 TECH NEWSLETTER - API Server');
    console.log('━'.repeat(50));
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`\nEndpoints disponíveis:`);
    console.log(`  GET  /api/health`);
    console.log(`  GET  /api/newsletters`);
    console.log(`  GET  /api/newsletter/latest`);
    console.log(`  GET  /api/newsletter/:date`);
    console.log(`  POST /api/newsletter/generate`);
    console.log('━'.repeat(50) + '\n');
});
