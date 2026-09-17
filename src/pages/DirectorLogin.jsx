import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import bcrypt from 'bcryptjs'
import { supabase } from '../supabaseClient'

function DirectorLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: fetchError } = await supabase
      .from('director')
      .select('*')
      .eq('username', username)
      .single()

    if (fetchError || !data) {
      setError('Invalid username or password')
      setLoading(false)
      return
    }

    const passwordMatches = bcrypt.compareSync(password, data.password_hash)

    if (!passwordMatches) {
      setError('Invalid username or password')
      setLoading(false)
      return
    }

    localStorage.setItem('director_logged_in', 'true')
    localStorage.setItem('director_name', data.username)
    navigate('/director-dashboard')
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="font-heading text-5xl text-brand-burgundy text-center mb-2 tracking-wide">
          Nucery
        </h1>
        <p className="text-center text-brand-text/60 mb-10 font-body text-sm tracking-widest uppercase">
          Director Panel
        </p>

        <form
          onSubmit={handleLogin}
          className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-5 border border-brand-gold/20"
        >
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-beige bg-brand-cream/50 focus:outline-none focus:ring-2 focus:ring-brand-gold text-brand-text"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-beige bg-brand-cream/50 focus:outline-none focus:ring-2 focus:ring-brand-gold text-brand-text"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-burgundy text-brand-gold font-medium py-3 rounded-lg hover:bg-brand-burgundy-light transition-colors duration-200 tracking-wide disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default DirectorLogin