import nodemailer from 'nodemailer';
import { generateEmailHTML } from '../templates/email.js';

/**
 * Cria transporter do Nodemailer
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

/**
 * Envia newsletter por email
 */
export async function sendNewsletter(curatedData, date = new Date()) {
  console.log('📧 Enviando newsletter por email...\n');

  try {
    const transporter = createTransporter();
    
    const dateStr = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const totalArticles = curatedData.highlights.length + 
      Object.values(curatedData.categories).flat().length;

    const mailOptions = {
      from: {
        name: 'Tech Newsletter',
        address: process.env.GMAIL_USER
      },
      to: process.env.RECIPIENT_EMAIL,
      subject: `📰 Tech Newsletter - ${dateStr} (${totalArticles} artigos curados)`,
      html: generateEmailHTML(curatedData, date),
      text: generateTextVersion(curatedData, date)
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado com sucesso!');
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`👤 Para: ${process.env.RECIPIENT_EMAIL}\n`);
    
    return info;

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    throw error;
  }
}

/**
 * Versão texto simples (fallback)
 */
function generateTextVersion(curatedData, date) {
  const formatDate = new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let text = `TECH NEWSLETTER - ${formatDate}\n`;
  text += '='.repeat(60) + '\n\n';

  if (curatedData.highlights.length > 0) {
    text += '🔥 DESTAQUES DO DIA\n\n';
    curatedData.highlights.forEach((article, i) => {
      text += `${i + 1}. ${article.title}\n`;
      text += `   Fonte: ${article.source} | ${'⭐'.repeat(article.relevance)}\n`;
      text += `   ${article.summary}\n`;
      text += `   Link: ${article.url}\n\n`;
    });
    text += '\n';
  }

  const sections = [
    { title: '🚀 LANÇAMENTOS', items: curatedData.categories.launches },
    { title: '📚 TUTORIAIS', items: curatedData.categories.tutorials },
    { title: '💡 DISCUSSÕES', items: curatedData.categories.discussions },
    { title: '📊 TENDÊNCIAS', items: curatedData.categories.trends }
  ];

  sections.forEach(section => {
    if (section.items.length > 0) {
      text += `${section.title}\n\n`;
      section.items.forEach((article, i) => {
        text += `${i + 1}. ${article.title}\n`;
        text += `   ${article.summary}\n`;
        text += `   ${article.url}\n\n`;
      });
      text += '\n';
    }
  });

  text += '-'.repeat(60) + '\n';
  text += 'Newsletter gerada automaticamente por Gemini AI\n';
  text += 'https://savycore.com.br\n';

  return text;
}
