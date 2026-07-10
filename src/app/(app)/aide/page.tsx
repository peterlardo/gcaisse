'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
  source?: string
}

const SUGGESTIONS = [
  'Comment créer une vente ?',
  'Comment ouvrir une session de caisse ?',
  'Quels sont les rôles disponibles ?',
  'Comment faire une production ?',
  'Comment suivre mes stocks ?',
  "Qu'est-ce qu'un bon de livraison ?",
]

export default function AidePage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Bonjour ${user?.firstName || ''} ! 👋\n\nJe suis l'assistant IA de **LCG Management**. Pose-moi des questions sur l'application, les modules, les rôles ou les fonctionnalités.\n\n*Exemples : "Comment créer une vente ?", "Quels sont les rôles ?"*`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const res = await fetch('/api/aide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })

      if (!res.ok) throw new Error('Erreur serveur')

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, source: data.source }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Désolé, une erreur est survenue. Réessaie plus tard.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title">Aide & Assistant IA</h1>
          <p className="text-sm text-gray-400 mt-1">Pose tes questions sur le fonctionnement de l'application</p>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-lcg-600 text-white rounded-br-md'
                      : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {m.source === 'manuel' && (
                    <p className="text-xs text-gray-400 mt-2 italic">Source : Manuel utilisateur</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-lcg-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-lcg-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-lcg-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-gray-100 p-4">
            <form
              onSubmit={e => { e.preventDefault(); handleSend() }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pose ta question sur l'application..."
                className="input-field flex-1"
                disabled={loading}
              />
              <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
                Envoyer
              </button>
            </form>
          </div>
        </div>

        <div className="w-72 shrink-0 hidden lg:flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Suggestions</h3>
            <div className="space-y-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="w-full text-left text-sm px-3 py-2 rounded-xl bg-gray-50 hover:bg-lcg-50 hover:text-lcg-700 text-gray-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-lcg-500 to-lcg-700 rounded-2xl p-4 text-white">
            <h3 className="font-semibold text-sm mb-2">Manuel utilisateur</h3>
            <p className="text-xs text-white/80 mb-3">
              Télécharge le manuel complet pour une référence hors ligne.
            </p>
            <a
              href="https://github.com/peterlardo/gcaisse/raw/master/MANUEL_UTILISATEUR.docx"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger le DOCX
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Identifiants de test</h3>
            <div className="space-y-1.5 text-xs">
              <p><span className="font-medium text-lcg-600">admin</span> / <span className="text-gray-400">admin123</span></p>
              <p><span className="font-medium text-lcg-600">directeur</span> / <span className="text-gray-400">admin123</span></p>
              <p><span className="font-medium text-lcg-600">stock1</span> / <span className="text-gray-400">password123</span></p>
              <p><span className="font-medium text-lcg-600">prod1</span> / <span className="text-gray-400">password123</span></p>
              <p><span className="font-medium text-lcg-600">caissier1</span> / <span className="text-gray-400">password123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
