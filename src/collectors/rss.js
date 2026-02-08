import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'TechNewsletter/1.0'
  }
});

// Fontes de conteúdo
const RSS_SOURCES = [
  {
    name: 'HackerNews',
    url: 'https://hnrss.org/frontpage',
    category: 'Tech Geral'
  },
  {
    name: 'Dev.to - AI',
    url: 'https://dev.to/feed/tag/ai',
    category: 'AI'
  },
  {
    name: 'Dev.to - React',
    url: 'https://dev.to/feed/tag/react',
    category: 'Frontend'
  },
  {
    name: 'Reddit Programming',
    url: 'https://www.reddit.com/r/programming/.rss',
    category: 'Discussões'
  },
  {
    name: 'Reddit Machine Learning',
    url: 'https://www.reddit.com/r/MachineLearning/.rss',
    category: 'AI'
  },
  {
    name: 'GitHub Blog',
    url: 'https://github.blog/feed/',
    category: 'Developer Tools'
  },
  {
    name: 'Vercel Blog',
    url: 'https://vercel.com/blog/feed',
    category: 'Frontend'
  }
];

/**
 * Coleta artigos de uma fonte RSS
 */
async function fetchFeed(source) {
  try {
    console.log(`📡 Coletando: ${source.name}...`);
    const feed = await parser.parseURL(source.url);
    
    const articles = feed.items.map(item => ({
      title: item.title,
      url: item.link,
      description: item.contentSnippet || item.description || '',
      publishedAt: item.pubDate || item.isoDate,
      source: source.name,
      sourceCategory: source.category
    }));

    console.log(`✅ ${source.name}: ${articles.length} artigos`);
    return articles;
  } catch (error) {
    console.error(`❌ Erro em ${source.name}:`, error.message);
    return [];
  }
}

/**
 * Filtra artigos das últimas 24 horas
 */
function filterLast24Hours(articles) {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return articles.filter(article => {
    if (!article.publishedAt) return false;
    const publishedDate = new Date(article.publishedAt);
    return publishedDate >= oneDayAgo;
  });
}

/**
 * Coleta de todas as fontes em paralelo
 */
export async function collectAllFeeds() {
  console.log('🚀 Iniciando coleta de feeds RSS...\n');
  
  const startTime = Date.now();
  
  // Busca todos os feeds em paralelo
  const results = await Promise.all(
    RSS_SOURCES.map(source => fetchFeed(source))
  );
  
  // Junta todos os artigos
  const allArticles = results.flat();
  
  // Filtra últimas 24h
  const recentArticles = filterLast24Hours(allArticles);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✨ Coleta finalizada em ${elapsed}s`);
  console.log(`📊 Total: ${allArticles.length} artigos`);
  console.log(`🕒 Últimas 24h: ${recentArticles.length} artigos\n`);
  
  return recentArticles;
}
