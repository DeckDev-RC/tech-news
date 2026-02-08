import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json');

const DEFAULT_CONFIG = {
    cronSchedule: '0 7 * * *',
    timezone: 'America/Sao_Paulo',
    sendEmailOnGenerate: false,
    lastUpdated: null
};

/**
 * Garante que o arquivo de config existe
 */
async function ensureConfig() {
    try {
        await fs.access(CONFIG_PATH);
    } catch {
        // Cria diretório e arquivo se não existir
        await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
        await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
    }
}

/**
 * Carrega configuração
 */
export async function loadConfig() {
    await ensureConfig();
    try {
        const content = await fs.readFile(CONFIG_PATH, 'utf-8');
        return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    } catch {
        return DEFAULT_CONFIG;
    }
}

/**
 * Salva configuração
 */
export async function saveConfig(updates) {
    await ensureConfig();
    const current = await loadConfig();
    const newConfig = {
        ...current,
        ...updates,
        lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
    return newConfig;
}

/**
 * Valida formato de cron
 */
export function isValidCron(expression) {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return false;

    // Validação básica - cada parte deve ter formato válido
    const patterns = [
        /^(\*|([0-5]?\d)([-/][0-5]?\d)*)$/,  // minuto
        /^(\*|([01]?\d|2[0-3])([-/]([01]?\d|2[0-3]))*)$/,  // hora
        /^(\*|([1-9]|[12]\d|3[01])([-/]([1-9]|[12]\d|3[01]))*)$/,  // dia do mês
        /^(\*|([1-9]|1[0-2])([-/]([1-9]|1[0-2]))*)$/,  // mês
        /^(\*|[0-6]([-/][0-6])*)$/  // dia da semana
    ];

    return parts.every((part, i) => patterns[i].test(part));
}
