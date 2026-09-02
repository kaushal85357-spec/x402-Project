import React, { useEffect, useRef, useState } from 'react'
import { register } from './auth'
import type { UserRole } from './auth'

const SUCCESS_MESSAGE = 'Registration successful! Please log in with your new credentials'

interface RegisterScreenProps {
  onRegistered: (message: string) => void
  onGoLogin: () => void
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegistered, onGoLogin }) => {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('Farmer')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const redirectTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimer.current !== null) {
        window.clearTimeout(redirectTimer.current)
      }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      register(name, password, role)
      setSuccess(SUCCESS_MESSAGE)
      redirectTimer.current = window.setTimeout(() => onRegistered(SUCCESS_MESSAGE), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="wheat-field min-h-screen flex items-center justify-center p-4">
      <div className="wheat-overlay" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-white drop-shadow-lg">Create your AgriProcure account</h1>
          <p className="mt-2 text-amber-50/90">Farmers use the portal free. Consumers pay $0.01 Testnet USDC to deploy the allocation agent.</p>
        </div>
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          <h2 className="text-2xl font-semibold text-amber-950">Register</h2>
          <label className="block">
            <span className="text-sm font-medium text-amber-900">Name</span>
            <input className="agri-input mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-amber-900">Password</span>
            <input
              type="password"
              className="agri-input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-amber-900">Role</span>
            <select className="agri-input mt-1" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="Farmer">Farmer</option>
              <option value="Consumer">Consumer</option>
            </select>
          </label>
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {success && (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{success}</p>
          )}
          <button type="submit" className="agri-btn-primary w-full" disabled={Boolean(success)}>
            Create account
          </button>
          <button type="button" className="w-full text-amber-900 underline-offset-4 hover:underline" onClick={onGoLogin}>
            Already registered? Sign in
          </button>
        </form>
      </div>
    </div>
  )
}

export default RegisterScreen
