import React, { useState } from 'react'
import { login } from './auth'
import type { AgriUser } from './auth'

interface LoginScreenProps {
  onLoggedIn: (user: AgriUser) => void
  onGoRegister: () => void
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoggedIn, onGoRegister }) => {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const user = login(name, password)
      onLoggedIn(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="wheat-field min-h-screen flex items-center justify-center p-4">
      <div className="wheat-overlay" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-amber-100/90 tracking-[0.35em] uppercase text-xs mb-2">Algorand x402 Hackathon</p>
          <h1 className="text-4xl font-semibold text-white drop-shadow-lg">AgriProcure AI</h1>
          <p className="mt-2 text-amber-50/90">Decentralized grain procurement for farmers and commercial buyers</p>
        </div>
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          <h2 className="text-2xl font-semibold text-amber-950">Welcome back</h2>
          <label className="block">
            <span className="text-sm font-medium text-amber-900">Name</span>
            <input
              className="agri-input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-amber-900">Password</span>
            <input
              type="password"
              className="agri-input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" className="agri-btn-primary w-full">
            Sign in
          </button>
          <button type="button" className="w-full text-amber-900 underline-offset-4 hover:underline" onClick={onGoRegister}>
            New User? Register
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginScreen
