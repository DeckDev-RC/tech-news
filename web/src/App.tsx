import { useState, useEffect } from 'react'
import { Sparkles, ExternalLink, Loader2, Clock, TrendingUp, BookOpen, Rocket, MessageSquare, X, ArrowUpRight, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import AdminPage from './AdminPage'
import './index.css'

interface Article {
  title: string
  original_title?: string
  url: string
  source: string
  category: string
  relevance: number
  summary: string
  tags: string[]
  reasoning?: string
}

interface NewsletterData {
  date: string
  generatedAt: string
  stats: {
    rawArticles: number
    curatedArticles: number
    highlights: number
  }
  data: {
    highlights: Article[]
    categories: {
      launches: Article[]
      tutorials: Article[]
      discussions: Article[]
      trends: Article[]
    }
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'admin'>(() => {
    // Check URL for admin access
    return window.location.hash === '#/admin' ? 'admin' : 'home'
  })
  const [newsletter, setNewsletter] = useState<NewsletterData | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'highlights' | 'launches' | 'tutorials' | 'discussions' | 'trends'>('highlights')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  // Fetch available dates and latest newsletter on mount
  useEffect(() => {
    if (currentPage === 'home') {
      fetchAvailableDates()
    }
  }, [currentPage])

  // Fetch newsletter when selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetchNewsletterByDate(selectedDate)
    }
  }, [selectedDate])

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedArticle(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  // Listen for hash changes (for admin routing)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(window.location.hash === '#/admin' ? 'admin' : 'home')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Render admin page if on admin route (AFTER all hooks)
  if (currentPage === 'admin') {
    return <AdminPage onBack={() => {
      window.location.hash = ''
      setCurrentPage('home')
    }} />
  }

  const fetchAvailableDates = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/newsletters`)
      if (!res.ok) throw new Error('Erro ao buscar newsletters')
      const data = await res.json()

      if (data.newsletters.length === 0) {
        setError('Nenhuma newsletter disponível ainda. A primeira será gerada às 7h.')
        setLoading(false)
        return
      }

      setAvailableDates(data.newsletters)
      setSelectedDate(data.newsletters[0]) // Most recent
    } catch {
      setError('Erro ao conectar com o servidor.')
      setLoading(false)
    }
  }

  const fetchNewsletterByDate = async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/newsletter/${date}`)
      if (!res.ok) throw new Error('Newsletter não encontrada')
      const data = await res.json()
      setNewsletter(data)
    } catch {
      setError('Erro ao buscar newsletter.')
    } finally {
      setLoading(false)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    if (!selectedDate || availableDates.length === 0) return
    const currentIndex = availableDates.indexOf(selectedDate)
    if (direction === 'prev' && currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1])
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1])
    }
  }

  const canNavigatePrev = selectedDate ? availableDates.indexOf(selectedDate) < availableDates.length - 1 : false
  const canNavigateNext = selectedDate ? availableDates.indexOf(selectedDate) > 0 : false


  const getArticles = () => {
    if (!newsletter) return []
    if (activeTab === 'highlights') return newsletter.data.highlights
    return newsletter.data.categories[activeTab] || []
  }

  const tabs = [
    { id: 'highlights', label: 'Destaques', icon: TrendingUp },
    { id: 'launches', label: 'Lançamentos', icon: Rocket },
    { id: 'tutorials', label: 'Tutoriais', icon: BookOpen },
    { id: 'discussions', label: 'Discussões', icon: MessageSquare },
    { id: 'trends', label: 'Tendências', icon: TrendingUp },
  ] as const

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Tech Newsletter</h1>
              {newsletter && (
                <p className="text-xs text-[#86868b]">
                  {new Date(newsletter.generatedAt).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Date Navigation */}
      {availableDates.length > 0 && (
        <div className="sticky top-[73px] z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              disabled={!canNavigatePrev}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Newsletter anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#86868b]" />
              <select
                value={selectedDate || ''}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-medium text-sm border-none outline-none cursor-pointer"
              >
                {availableDates.map(date => (
                  <option key={date} value={date} className="bg-black text-white">
                    {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => navigateDate('next')}
              disabled={!canNavigateNext}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Newsletter próxima"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {availableDates.length > 1 && (
              <span className="text-xs text-[#86868b] ml-2">
                {availableDates.indexOf(selectedDate || '') + 1} de {availableDates.length}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-12 h-12 animate-spin text-[#0071e3] mb-4" />
            <p className="text-[#86868b]">Carregando newsletter...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[#86868b] mb-6 max-w-md">{error}</p>
          </div>
        )}

        {/* Newsletter Content */}
        {newsletter && !loading && (
          <>
            {/* Stats Bar */}
            <div className="flex items-center gap-6 mb-8 text-sm text-[#86868b]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{newsletter.stats.rawArticles} artigos coletados</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>{newsletter.stats.curatedArticles} curados pela IA</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab !== tab.id && (
                    <span className="text-xs opacity-60">
                      ({tab.id === 'highlights'
                        ? newsletter.data.highlights.length
                        : newsletter.data.categories[tab.id]?.length || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Articles Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {getArticles().map((article, index) => (
                <ArticleCard
                  key={index}
                  article={article}
                  onClick={() => setSelectedArticle(article)}
                />
              ))}
            </div>

            {getArticles().length === 0 && (
              <div className="text-center py-12 text-[#86868b]">
                Nenhum artigo nesta categoria.
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 text-center text-[#86868b] text-sm border-t border-white/10">
        <p>Curadoria automática por IA • Feito para devs brasileiros</p>
      </footer>

      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  )
}

function ArticleCard({ article, onClick }: { article: Article; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="article-card group block cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-lg font-medium group-hover:text-[#0071e3] transition-colors">
          {article.title}
        </h3>
      </div>

      <p className="text-sm text-[#86868b] mb-4 line-clamp-2">
        {article.summary}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="tag-minimal">{article.source}</span>
          <span className="tag-minimal">{article.category}</span>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i < article.relevance ? 'bg-[#0071e3]' : 'bg-white/20'
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ArticleModal({ article, onClose }: { article: Article; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#1c1c1e] rounded-2xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Category & Source */}
          <div className="flex items-center gap-2 mb-4">
            <span className="tag-minimal">{article.source}</span>
            <span className="tag-minimal">{article.category}</span>
            <div className="flex items-center gap-1 ml-auto">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < article.relevance ? 'bg-[#0071e3]' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
            {article.title}
          </h2>

          {/* Original Title (if different) */}
          {article.original_title && article.original_title !== article.title && (
            <p className="text-sm text-[#86868b] italic mb-6">
              Original: {article.original_title}
            </p>
          )}

          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#86868b] uppercase tracking-wide mb-2">
              Resumo
            </h3>
            <p className="text-lg text-[#f5f5f7] leading-relaxed">
              {article.summary}
            </p>
          </div>

          {/* Reasoning */}
          {article.reasoning && (
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-[#86868b] uppercase tracking-wide mb-2">
                Por que é relevante?
              </h3>
              <p className="text-[#f5f5f7]">
                {article.reasoning}
              </p>
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-[#86868b] uppercase tracking-wide mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, i) => (
                  <span key={i} className="tag-minimal">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Original Link Button */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full justify-center"
          >
            <ExternalLink className="w-4 h-4" />
            Ver Artigo Original
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
