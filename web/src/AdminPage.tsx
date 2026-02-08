import { useState, useEffect } from 'react'
import { Settings, LogIn, LogOut, Save, Loader2, Clock, AlertCircle, Check, Sparkles } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

interface Config {
    cronSchedule: string
    timezone: string
    sendEmailOnGenerate: boolean
    lastUpdated: string | null
}

export default function AdminPage({ onBack }: { onBack: () => void }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')
    const [loginLoading, setLoginLoading] = useState(false)

    const [config, setConfig] = useState<Config | null>(null)
    const [cronSchedule, setCronSchedule] = useState('')
    const [timezone, setTimezone] = useState('')
    const [sendEmail, setSendEmail] = useState(false)
    const [saving, setSaving] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Check if already logged in (via sessionStorage)
    useEffect(() => {
        const auth = sessionStorage.getItem('admin_auth')
        if (auth) {
            setIsLoggedIn(true)
            fetchConfig(auth)
        }
    }, [])

    const getAuthHeader = () => {
        const auth = sessionStorage.getItem('admin_auth')
        return auth ? `Basic ${auth}` : ''
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoginError('')
        setLoginLoading(true)

        try {
            const base64Creds = btoa(`${username}:${password}`)

            const res = await fetch(`${API_URL}/api/admin/login`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${base64Creds}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!res.ok) {
                throw new Error('Credenciais inválidas')
            }

            const data = await res.json()
            sessionStorage.setItem('admin_auth', base64Creds)
            setIsLoggedIn(true)
            setConfig(data.config)
            setCronSchedule(data.config.cronSchedule)
            setTimezone(data.config.timezone)
            setSendEmail(data.config.sendEmailOnGenerate)

        } catch {
            setLoginError('Usuário ou senha incorretos')
        } finally {
            setLoginLoading(false)
        }
    }

    const fetchConfig = async (auth: string) => {
        try {
            const res = await fetch(`${API_URL}/api/admin/config`, {
                headers: { 'Authorization': `Basic ${auth}` }
            })
            if (res.ok) {
                const data = await res.json()
                setConfig(data)
                setCronSchedule(data.cronSchedule)
                setTimezone(data.timezone)
                setSendEmail(data.sendEmailOnGenerate)
            }
        } catch (err) {
            console.error('Erro ao carregar config:', err)
        }
    }

    const handleLogout = () => {
        sessionStorage.removeItem('admin_auth')
        setIsLoggedIn(false)
        setConfig(null)
        setUsername('')
        setPassword('')
    }

    const handleSave = async () => {
        setSaving(true)
        setSaveMessage(null)

        try {
            const res = await fetch(`${API_URL}/api/admin/config`, {
                method: 'PUT',
                headers: {
                    'Authorization': getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cronSchedule,
                    timezone,
                    sendEmailOnGenerate: sendEmail
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao salvar')
            }

            setConfig(data.config)
            setSaveMessage({ type: 'success', text: 'Configuração salva com sucesso!' })

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao salvar configuração'
            setSaveMessage({ type: 'error', text: message })
        } finally {
            setSaving(false)
        }
    }

    const handleGenerate = async () => {
        setGenerating(true)
        setSaveMessage(null)

        try {
            const res = await fetch(`${API_URL}/api/newsletter/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': getAuthHeader(),
                    'Content-Type': 'application/json'
                }
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao gerar')
            }

            setSaveMessage({
                type: 'success',
                text: `Newsletter gerada! ${data.stats.rawArticles} artigos coletados, ${data.stats.highlights} destaques.`
            })

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao gerar newsletter'
            setSaveMessage({ type: 'error', text: message })
        } finally {
            setGenerating(false)
        }
    }

    // Common schedules for quick selection
    const commonSchedules = [
        { label: '6h', value: '0 6 * * *' },
        { label: '7h', value: '0 7 * * *' },
        { label: '8h', value: '0 8 * * *' },
        { label: '9h', value: '0 9 * * *' },
        { label: '12h', value: '0 12 * * *' },
        { label: '18h', value: '0 18 * * *' },
    ]

    return (
        <div className="min-h-screen w-full overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="font-semibold text-lg">Admin</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {isLoggedIn && (
                            <button
                                onClick={handleLogout}
                                className="text-sm text-[#86868b] hover:text-white transition-colors flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Sair
                            </button>
                        )}
                        <button
                            onClick={onBack}
                            className="text-sm text-[#86868b] hover:text-white transition-colors"
                        >
                            ← Voltar
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-8">
                {/* Login Form */}
                {!isLoggedIn && (
                    <div className="max-w-sm mx-auto">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                                <LogIn className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Login Admin</h2>
                            <p className="text-[#86868b]">Entre para configurar a newsletter</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[#86868b] mb-2">Usuário</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="input-modern w-full"
                                    placeholder="admin"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[#86868b] mb-2">Senha</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-modern w-full"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {loginError && (
                                <div className="flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {loginError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loginLoading}
                                className="btn-primary w-full justify-center"
                            >
                                {loginLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5" />
                                        Entrar
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Config Panel */}
                {isLoggedIn && config && (
                    <div className="space-y-8">
                        {/* Cron Schedule */}
                        <section className="article-card">
                            <div className="flex items-center gap-3 mb-4">
                                <Clock className="w-5 h-5 text-[#0071e3]" />
                                <h2 className="text-lg font-semibold">Horário da Newsletter</h2>
                            </div>

                            <p className="text-sm text-[#86868b] mb-4">
                                Configure quando a newsletter será gerada automaticamente.
                            </p>

                            {/* Quick select */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {commonSchedules.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => setCronSchedule(s.value)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${cronSchedule === s.value
                                            ? 'bg-[#0071e3] text-white'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom input */}
                            <div>
                                <label className="block text-sm text-[#86868b] mb-2">
                                    Expressão Cron (avançado)
                                </label>
                                <input
                                    type="text"
                                    value={cronSchedule}
                                    onChange={(e) => setCronSchedule(e.target.value)}
                                    className="input-modern w-full font-mono"
                                    placeholder="0 7 * * *"
                                />
                                <p className="text-xs text-[#86868b] mt-2">
                                    Formato: minuto hora dia mês dia-semana
                                </p>
                            </div>
                        </section>

                        {/* Timezone */}
                        <section className="article-card">
                            <h2 className="text-lg font-semibold mb-4">Fuso Horário</h2>
                            <select
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="input-modern w-full"
                            >
                                <option value="America/Sao_Paulo">São Paulo (BRT)</option>
                                <option value="America/New_York">New York (EST)</option>
                                <option value="Europe/London">London (GMT)</option>
                                <option value="Europe/Paris">Paris (CET)</option>
                                <option value="Asia/Tokyo">Tokyo (JST)</option>
                            </select>
                        </section>

                        {/* Email option */}
                        <section className="article-card">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={sendEmail}
                                    onChange={(e) => setSendEmail(e.target.checked)}
                                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-[#0071e3] focus:ring-[#0071e3]"
                                />
                                <div>
                                    <span className="font-medium">Enviar por email ao gerar</span>
                                    <p className="text-sm text-[#86868b]">
                                        Envia a newsletter por email automaticamente
                                    </p>
                                </div>
                            </label>
                        </section>

                        {/* Save Message */}
                        {saveMessage && (
                            <div className={`flex items-center gap-2 p-4 rounded-xl ${saveMessage.type === 'success'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                                }`}>
                                {saveMessage.type === 'success' ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5" />
                                )}
                                {saveMessage.text}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary justify-center"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Salvar
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all bg-green-600 hover:bg-green-500 text-white disabled:opacity-50"
                            >
                                {generating ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Gerar Agora
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Last updated */}
                        {config.lastUpdated && (
                            <p className="text-center text-sm text-[#86868b]">
                                Última atualização: {new Date(config.lastUpdated).toLocaleString('pt-BR')}
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
