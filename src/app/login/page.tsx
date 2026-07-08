'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const success = await login(username, password)
    setLoading(false)
    if (success) window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lcg-500 to-lcg-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-lcg-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">LCG</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">La Congolaise des Glaçons</h1>
          <p className="text-gray-500 mt-1">Logiciel de gestion</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Nom d'utilisateur</label>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label-field">Mot de passe</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">
          LCG - La Congolaise des Glaçons © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
