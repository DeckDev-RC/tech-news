/**
 * Gera HTML do email
 */
export function generateEmailHTML(curatedData, date) {
  const formatDate = new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const renderArticle = (article) => `
    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px;">
        <a href="${article.url}" style="color: #007bff; text-decoration: none;">${article.title}</a>
      </h3>
      <div style="font-size: 12px; color: #6c757d; margin-bottom: 8px;">
        <span style="background: #e9ecef; padding: 2px 8px; border-radius: 12px; margin-right: 8px;">
          ${article.source}
        </span>
        ${'⭐'.repeat(article.relevance)}
        ${article.tags ? article.tags.map(tag => 
          `<span style="background: #d1ecf1; color: #0c5460; padding: 2px 8px; border-radius: 12px; margin-left: 4px; font-size: 11px;">${tag}</span>`
        ).join('') : ''}
      </div>
      <p style="margin: 8px 0; color: #495057; line-height: 1.6;">${article.summary}</p>
      ${article.reasoning ? `<p style="margin: 8px 0; font-size: 13px; color: #6c757d; font-style: italic;">💡 ${article.reasoning}</p>` : ''}
    </div>
  `;

  const renderSection = (title, articles, emoji) => {
    if (articles.length === 0) return '';
    
    return `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #343a40; border-bottom: 2px solid #dee2e6; padding-bottom: 8px; margin-bottom: 16px;">
          ${emoji} ${title} (${articles.length})
        </h2>
        ${articles.map(renderArticle).join('')}
      </div>
    `;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tech Newsletter</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: #ffffff;">
  
  <!-- Header -->
  <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📰 Tech Newsletter</h1>
    <p style="color: #e0e0e0; margin: 8px 0 0 0; font-size: 14px;">${formatDate}</p>
  </div>

  <!-- Highlights -->
  ${curatedData.highlights.length > 0 ? `
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="color: white; margin: 0 0 16px 0; font-size: 22px;">🔥 Destaques do Dia</h2>
      ${curatedData.highlights.map(article => `
        <div style="background: rgba(255,255,255,0.95); padding: 15px; border-radius: 8px; margin-bottom: 12px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px;">
            <a href="${article.url}" style="color: #c2185b; text-decoration: none;">${article.title}</a>
          </h3>
          <div style="font-size: 12px; color: #6c757d; margin-bottom: 8px;">
            <span style="background: #fce4ec; padding: 2px 8px; border-radius: 12px; margin-right: 8px;">${article.source}</span>
            ${'⭐'.repeat(article.relevance)}
          </div>
          <p style="margin: 8px 0; color: #495057;">${article.summary}</p>
          ${article.reasoning ? `<p style="margin: 8px 0; font-size: 13px; color: #c2185b; font-weight: 500;">💡 ${article.reasoning}</p>` : ''}
        </div>
      `).join('')}
    </div>
  ` : ''}

  <!-- Categories -->
  ${renderSection('Lançamentos', curatedData.categories.launches, '🚀')}
  ${renderSection('Tutoriais', curatedData.categories.tutorials, '📚')}
  ${renderSection('Discussões Técnicas', curatedData.categories.discussions, '💡')}
  ${renderSection('Tendências & Análises', curatedData.categories.trends, '📊')}

  <!-- Footer -->
  <div style="text-align: center; padding: 20px 0; border-top: 2px solid #dee2e6; margin-top: 30px; color: #6c757d; font-size: 13px;">
    <p>Newsletter gerada automaticamente com ❤️ por Gemini AI</p>
    <p style="margin-top: 8px;">
      <a href="https://savycore.com.br" style="color: #007bff; text-decoration: none;">savycore.com.br</a>
    </p>
  </div>

</body>
</html>
  `.trim();
}
