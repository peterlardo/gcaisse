'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

type View = 'inbox' | 'sent' | 'compose' | 'detail'

export default function MessageriePage() {
  const { user } = useAuth()
  const [view, setView] = useState<View>('inbox')
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])

  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [sending, setSending] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const fetchMessages = async (box: 'inbox' | 'sent') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ box, page: String(page), limit: '30' })
      const res = await fetch(`/api/messages?${params}`)
      const data = await res.json()
      setMessages(data.messages || [])
      setTotalPages(data.totalPages || 1)
      if (box === 'inbox') setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) setUsers((await res.json()).users || [])
    } catch {}
  }

  useEffect(() => { if (view === 'inbox' || view === 'sent') fetchMessages(view as 'inbox' | 'sent') }, [page, view])
  useEffect(() => { fetchUsers() }, [])

  const fileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(f)
    })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipientId || !subject.trim() || !content.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    setSending(true)
    try {
      let fileData: { name: string; data: string; type: string } | null = null

      if (file) {
        setUploading(true)
        const base64 = await fileToBase64(file)
        fileData = { name: file.name, data: base64, type: file.type }
        setUploading(false)
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId,
          subject: subject.trim(),
          content: content.trim(),
          parentId: selectedMessage?.id || null,
          file: fileData,
        }),
      })
      if (res.ok) {
        toast.success('Message envoyé')
        setSubject('')
        setContent('')
        setRecipientId('')
        setFile(null)
        setSelectedMessage(null)
        setView('sent')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  const openMessage = async (id: number) => {
    try {
      const res = await fetch(`/api/messages/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedMessage(data.message)
        setView('detail')
        if (view === 'inbox') fetchMessages('inbox')
      }
    } catch {}
  }

  const handleReply = (msg: any) => {
    setRecipientId(String(msg.senderId === user?.id ? msg.recipientId : msg.senderId))
    setSubject(`Re: ${msg.subject}`)
    setContent('')
    setSelectedMessage(msg)
    setView('compose')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce message ?')) return
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Message supprimé')
        if (view === 'detail') {
          setSelectedMessage(null)
          setView('inbox')
        } else {
          fetchMessages(view as 'inbox' | 'sent')
        }
      }
    } catch {}
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  if (!user) return null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Messagerie</h1>
        <div className="flex gap-2">
          <button onClick={() => { setView('inbox'); setPage(1) }} className={`btn-sm ${view === 'inbox' ? 'btn-primary' : 'btn-secondary'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            {view === 'inbox' ? 'Boîte de réception' : 'Réception'}
            {unreadCount > 0 && <span className="ml-1.5 bg-lcg-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
          </button>
          <button onClick={() => { setView('sent'); setPage(1) }} className={`btn-sm ${view === 'sent' ? 'btn-primary' : 'btn-secondary'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Envoyés
          </button>
          <button onClick={() => { setView('compose'); setSelectedMessage(null); setSubject(''); setContent(''); setRecipientId('') }} className={`btn-sm ${view === 'compose' ? 'btn-primary' : 'btn-secondary'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau message
          </button>
        </div>
      </div>

      {view === 'compose' && (
        <form onSubmit={handleSend} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          {selectedMessage && selectedMessage.id && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500 mb-2">
              En réponse à : <span className="font-medium text-gray-700">{selectedMessage.subject}</span>
              <br />
              <span className="text-xs">de {selectedMessage.sender?.firstName} {selectedMessage.sender?.lastName}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinataire</label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Sélectionner un utilisateur...</option>
              {users.filter(u => u.id !== user.id).map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role.replace(/_/g, ' ')})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input-field"
              placeholder="Objet du message"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="input-field resize-y"
              placeholder="Votre message..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pièce jointe (optionnelle)</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm text-gray-600">{file ? file.name : 'Choisir un fichier'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/csv,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {file && (
                <button type="button" onClick={() => setFile(null)} className="text-xs text-red-500 hover:underline">
                  Supprimer
                </button>
              )}
              <span className="text-xs text-gray-400">Max 10 Mo</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setView('inbox')} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={sending || uploading} className="btn-primary">
              {uploading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Upload en cours...
                </span>
              ) : sending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Envoi en cours...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Envoyer
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {view === 'detail' && selectedMessage && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedMessage.subject}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {new Date(selectedMessage.createdAt).toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleReply(selectedMessage)} className="btn-secondary btn-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Répondre
                </button>
                <button onClick={() => handleDelete(selectedMessage.id)} className="btn-secondary btn-sm text-red-600 hover:bg-red-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-gray-400">De:</span>
                <span className="font-medium text-gray-700">{selectedMessage.sender?.firstName} {selectedMessage.sender?.lastName}</span>
                <span className="text-xs text-gray-400">({selectedMessage.sender?.email})</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-gray-400">À:</span>
                <span className="font-medium text-gray-700">{selectedMessage.recipient?.firstName} {selectedMessage.recipient?.lastName}</span>
                <span className="text-xs text-gray-400">({selectedMessage.recipient?.email})</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedMessage.content}</p>
            {selectedMessage.fileName && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Pièce jointe</p>
                <a
                  href={`/api/messages/${selectedMessage.id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{selectedMessage.fileName}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
          {selectedMessage.replies && selectedMessage.replies.length > 0 && (
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {selectedMessage.replies.map((reply: any) => (
                <div key={reply.id} className="p-6 bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">{reply.sender.firstName} {reply.sender.lastName}</span>
                    <span className="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{reply.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(view === 'inbox' || view === 'sent') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              {view === 'inbox' ? 'Boîte de réception' : 'Messages envoyés'}
              {unreadCount > 0 && view === 'inbox' && <span className="ml-2 text-lcg-600">({unreadCount} non lu{unreadCount > 1 ? 's' : ''})</span>}
            </p>
            <span className="text-xs text-gray-400">Page {page} sur {totalPages}</span>
          </div>

          {loading ? (
            <div className="loader py-12"><div className="loader-spinner" /></div>
          ) : messages.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="empty-state-title">{view === 'inbox' ? 'Aucun message reçu' : 'Aucun message envoyé'}</p>
              <p className="empty-state-text">
                {view === 'inbox' ? 'Les messages que vous recevez apparaîtront ici.' : 'Cliquez sur "Nouveau message" pour envoyer un message.'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {messages.map((msg: any) => {
                  const isUnread = view === 'inbox' && !msg.isRead
                  return (
                    <button
                      key={msg.id}
                      onClick={() => openMessage(msg.id)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors flex items-start gap-3 ${isUnread ? 'bg-lcg-50/50' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isUnread ? 'bg-lcg-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <span className="text-xs font-bold">
                          {view === 'inbox'
                            ? (msg.sender?.firstName?.[0] || '?') + (msg.sender?.lastName?.[0] || '')
                            : (msg.recipient?.firstName?.[0] || '?') + (msg.recipient?.lastName?.[0] || '')
                          }
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {view === 'inbox' ? `${msg.sender?.firstName} ${msg.sender?.lastName}` : `${msg.recipient?.firstName} ${msg.recipient?.lastName}`}
                          </p>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className={`text-sm truncate mt-0.5 ${isUnread ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{msg.subject}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{msg.content}</p>
                        {msg.fileName && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {msg.fileName}
                          </span>
                        )}
                      </div>
                      {isUnread && <span className="w-2 h-2 bg-lcg-600 rounded-full shrink-0 mt-2" />}
                    </button>
                  )
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Précédent
                  </button>
                  <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm">
                    Suivant
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
