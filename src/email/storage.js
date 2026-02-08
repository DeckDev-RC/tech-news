import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'newsletters');

/**
 * Garante que o diretório existe
 */
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Salva newsletter em JSON
 */
export async function saveNewsletter(curatedData, rawArticles, date = new Date()) {
  console.log('💾 Salvando newsletter em JSON...\n');

  try {
    await ensureDataDir();

    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `${dateStr}.json`;
    const filepath = path.join(DATA_DIR, filename);

    const newsletterData = {
      date: dateStr,
      generatedAt: new Date().toISOString(),
      stats: {
        rawArticles: rawArticles.length,
        curatedArticles: curatedData.highlights.length + 
          Object.values(curatedData.categories).flat().length,
        highlights: curatedData.highlights.length,
        categories: {
          launches: curatedData.categories.launches.length,
          tutorials: curatedData.categories.tutorials.length,
          discussions: curatedData.categories.discussions.length,
          trends: curatedData.categories.trends.length
        }
      },
      data: curatedData,
      raw: rawArticles
    };

    await fs.writeFile(
      filepath,
      JSON.stringify(newsletterData, null, 2),
      'utf-8'
    );

    const fileSize = (await fs.stat(filepath)).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);

    console.log('✅ Newsletter salva com sucesso!');
    console.log(`📁 Arquivo: ${filename}`);
    console.log(`📊 Tamanho: ${fileSizeKB} KB`);
    console.log(`📂 Caminho: ${filepath}\n`);

    return filepath;

  } catch (error) {
    console.error('❌ Erro ao salvar newsletter:', error.message);
    throw error;
  }
}

/**
 * Lista todas as newsletters salvas
 */
export async function listNewsletters() {
  try {
    await ensureDataDir();
    const files = await fs.readdir(DATA_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse(); // Mais recente primeiro
  } catch (error) {
    console.error('❌ Erro ao listar newsletters:', error.message);
    return [];
  }
}

/**
 * Carrega uma newsletter específica
 */
export async function loadNewsletter(date) {
  try {
    const filename = `${date}.json`;
    const filepath = path.join(DATA_DIR, filename);
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Erro ao carregar newsletter ${date}:`, error.message);
    return null;
  }
}
