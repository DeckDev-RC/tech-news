import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

const CURATOR_PROMPT = `Você é um curador expert de conteúdo tech/programação/IA para uma newsletter BRASILEIRA.

Analise os artigos fornecidos e retorne um JSON com a seguinte estrutura:

{
  "highlights": [
    // TOP 5 artigos mais importantes/relevantes do dia
  ],
  "categories": {
    "launches": [],      // Lançamentos de produtos, features, versões
    "tutorials": [],     // Tutoriais, how-tos, guias práticos
    "discussions": [],   // Discussões técnicas, debates, opiniões
    "trends": []         // Análises de mercado, tendências, estudos
  }
}

Para cada artigo, retorne:
{
  "title": "título TRADUZIDO para português brasileiro",
  "original_title": "título original em inglês (se aplicável)",
  "url": "url original",
  "source": "fonte original",
  "category": "categoria principal",
  "relevance": 1-5,  // 5 = muito relevante, 1 = pouco relevante
  "summary": "resumo em 2-3 linhas focado no valor/aprendizado",
  "tags": ["tag1", "tag2", "tag3"],
  "reasoning": "por que isso é relevante (1 linha)"
}

TRADUÇÃO OBRIGATÓRIA:
- TRADUZA todos os títulos para português brasileiro natural e fluente
- Mantenha termos técnicos em inglês: API, React, Node.js, TypeScript, DevOps, etc
- Use linguagem informal mas profissional, como um dev brasileiro falaria
- Exemplos:
  - "How to Build a REST API" → "Como Criar uma API REST"
  - "React 19 is Here" → "React 19 Chegou!"
  - "Why Senior Developers Use..." → "Por Que Devs Seniors Usam..."

CRITÉRIOS DE RELEVÂNCIA:
- 5: Breaking news, major launches, game-changers
- 4: Tutoriais práticos úteis, discussões importantes
- 3: Conteúdo interessante mas não urgente
- 2: Conteúdo específico/nicho
- 1: Conteúdo repetitivo ou de baixo valor

IMPORTANTE:
- Priorize artigos sobre: Claude, IA generativa, React, Node.js, DevTools modernos
- Destaque artigos do tipo "como seniors usam X" ou "padrões de uso"
- Seja crítico: exclua clickbait e conteúdo superficial
- Retorne APENAS o JSON válido, sem texto adicional`;

/**
 * Processa artigos com Gemini
 */
export async function processWithAI(articles) {
  console.log('🤖 Processando com Gemini AI...\n');

  if (articles.length === 0) {
    console.log('⚠️  Nenhum artigo para processar');
    return {
      highlights: [],
      categories: {
        launches: [],
        tutorials: [],
        discussions: [],
        trends: []
      }
    };
  }

  try {
    const startTime = Date.now();

    // Prepara os artigos para o prompt
    const articlesText = articles.map((article, index) =>
      `[${index + 1}]
Título: ${article.title}
URL: ${article.url}
Fonte: ${article.source}
Descrição: ${article.description.slice(0, 300)}...
---`
    ).join('\n\n');

    const fullPrompt = `${CURATOR_PROMPT}\n\nARTIGOS PARA ANALISAR:\n\n${articlesText}\n\nRETORNE O JSON:`;

    // Chama o Gemini
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text();

    // Remove markdown code blocks se existir
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const curatedData = JSON.parse(text);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    // Estatísticas
    const totalCurated = curatedData.highlights.length +
      Object.values(curatedData.categories).flat().length;

    console.log(`✅ Processamento concluído em ${elapsed}s`);
    console.log(`📌 Highlights: ${curatedData.highlights.length}`);
    console.log(`🚀 Lançamentos: ${curatedData.categories.launches.length}`);
    console.log(`📚 Tutoriais: ${curatedData.categories.tutorials.length}`);
    console.log(`💡 Discussões: ${curatedData.categories.discussions.length}`);
    console.log(`📊 Tendências: ${curatedData.categories.trends.length}`);
    console.log(`📝 Total curado: ${totalCurated}/${articles.length}\n`);

    return curatedData;

  } catch (error) {
    console.error('❌ Erro ao processar com Gemini:', error.message);
    throw error;
  }
}
