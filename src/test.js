import 'dotenv/config';
import { collectAllFeeds } from './collectors/rss.js';

/**
 * Testa apenas a coleta de RSS (sem IA, sem email)
 */
async function testRSSCollection() {
  console.log('🧪 TESTE: Coleta de RSS Feeds\n');
  
  try {
    const articles = await collectAllFeeds();
    
    console.log('\n📋 AMOSTRA DOS ARTIGOS:\n');
    
    // Mostra os 5 primeiros
    articles.slice(0, 5).forEach((article, i) => {
      console.log(`${i + 1}. ${article.title}`);
      console.log(`   Fonte: ${article.source}`);
      console.log(`   URL: ${article.url}`);
      console.log(`   Data: ${article.publishedAt}\n`);
    });

    if (articles.length > 5) {
      console.log(`... e mais ${articles.length - 5} artigos\n`);
    }

    console.log('✅ Teste concluído com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    process.exit(1);
  }
}

testRSSCollection();
