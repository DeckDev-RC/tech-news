import 'dotenv/config';
import cron from 'node-cron';
import { collectAllFeeds } from './collectors/rss.js';
import { processWithAI } from './ai/gemini.js';
import { sendNewsletter } from './email/sender.js';
import { saveNewsletter } from './email/storage.js';

/**
 * Executa o processo completo de newsletter
 */
async function runNewsletterJob() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 INICIANDO GERAÇÃO DA NEWSLETTER');
  console.log('='.repeat(70) + '\n');
  
  const startTime = Date.now();
  
  try {
    // 1. Coleta RSS feeds
    const rawArticles = await collectAllFeeds();
    
    if (rawArticles.length === 0) {
      console.log('⚠️  Nenhum artigo novo encontrado. Newsletter cancelada.\n');
      return;
    }

    // 2. Processa com IA
    const curatedData = await processWithAI(rawArticles);

    // 3. Salva em JSON
    await saveNewsletter(curatedData, rawArticles);

    // 4. Envia por email
    await sendNewsletter(curatedData);

    // Resumo final
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('='.repeat(70));
    console.log(`✨ NEWSLETTER CONCLUÍDA EM ${elapsed}s`);
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Valida variáveis de ambiente
 */
function validateEnv() {
  const required = [
    'GEMINI_API_KEY',
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
    'RECIPIENT_EMAIL'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente faltando:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nCrie um arquivo .env baseado no .env.example\n');
    process.exit(1);
  }

  console.log('✅ Variáveis de ambiente configuradas\n');
}

/**
 * Inicializa o sistema
 */
async function init() {
  console.log('\n📰 TECH NEWSLETTER - Sistema de Curadoria Automática');
  console.log('━'.repeat(70) + '\n');

  // Valida configuração
  validateEnv();

  // Verifica se deve rodar imediatamente ou só agendar
  const args = process.argv.slice(2);
  
  if (args.includes('--now')) {
    // Executa imediatamente
    console.log('⚡ Modo execução imediata\n');
    await runNewsletterJob();
  } else {
    // Agenda via cron
    const schedule = process.env.CRON_SCHEDULE || '0 7 * * *';
    
    console.log(`⏰ Newsletter agendada: ${schedule}`);
    console.log('   (todo dia às 7h da manhã)\n');
    console.log('💡 Para testar agora, execute: npm start -- --now\n');
    console.log('🔄 Sistema aguardando próxima execução...\n');

    cron.schedule(schedule, () => {
      runNewsletterJob();
    }, {
      timezone: process.env.TZ || 'America/Sao_Paulo'
    });
  }
}

// Inicia o sistema
init().catch(error => {
  console.error('❌ Erro fatal na inicialização:', error);
  process.exit(1);
});
