import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import bcrypt from 'bcryptjs'
import { supabase } from '../supabaseClient'

function DirectorDashboard() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const navigate = useNavigate()

  const fetchLeaders = async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('team_leaders')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error(fetchError)
    } else {
      setLeaders(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLeaders()
  }, [])

  const handleAddLeader = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !username.trim() || !password.trim()) return

    setSubmitting(true)

    const passwordHash = bcrypt.hashSync(password, 10)

    const { error: insertError } = await supabase.from('team_leaders').insert({
      name,
      username,
      password_hash: passwordHash,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('This username is already taken.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setSubmitting(false)
      return
    }

    setName('')
    setUsername('')
    setPassword('')
    setSubmitting(false)
    fetchLeaders()
  }

  const removeLeader = async (id) => {
    const { error: deleteError } = await supabase
      .from('team_leaders')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error(deleteError)
      return
    }

    fetchLeaders()
  }

  const handleLogout = () => {
    localStorage.removeItem('director_logged_in')
    localStorage.removeItem('director_name')
    navigate('/director-login')
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setChangingPassword(true)

    const directorUsername = localStorage.getItem('director_name')
    const newHash = bcrypt.hashSync(newPassword, 10)

    const { error: updateError } = await supabase
      .from('director')
      .update({ password_hash: newHash })
      .eq('username', directorUsername)

    if (updateError) {
      setPasswordError('Something went wrong. Please try again.')
      setChangingPassword(false)
      return
    }

    setPasswordSuccess('Password updated successfully.')
    setNewPassword('')
    setConfirmPassword('')
    setChangingPassword(false)
  }

  return (
    <div className="min-h-screen bg-brand-cream px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-4xl text-brand-burgundy tracking-wide">
              Nucery
            </h1>
            <p className="text-brand-text/60 font-body text-sm tracking-widest uppercase mt-1">
              Director Dashboard
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
              <Link
    to="/manage-tasks"
    className="bg-white/60 border border-brand-burgundy text-brand-burgundy font-medium px-5 py-2.5 rounded-lg hover:bg-white transition-colors duration-200 tracking-wide text-sm"
  >
    Manage Tasks
  </Link>

            <Link
              to="/monthly-performance"
              className="bg-white/60 border border-brand-burgundy text-brand-burgundy font-medium px-5 py-2.5 rounded-lg hover:bg-white transition-colors duration-200 tracking-wide text-sm"
            >
              Monthly Performance
            </Link>
<Link
  to="/data-cleanup"
  className="bg-white/60 border border-brand-burgundy text-brand-burgundy font-medium px-5 py-2.5 rounded-lg hover:bg-white transition-colors duration-200 tracking-wide text-sm"
>
  Data Cleanup
</Link>
            <Link
              to="/leaderboard"
              className="bg-brand-burgundy text-brand-gold font-medium px-5 py-2.5 rounded-lg hover:bg-brand-burgundy-light transition-colors duration-200 tracking-wide text-sm"
            >
              View Leaderboard
            </Link>

            <button
              onClick={() => setShowChangePassword(true)}
              className="text-xs text-brand-burgundy underline hover:text-brand-burgundy-light"
            >
              Change Password
            </button>

            <button
              onClick={handleLogout}
              className="text-xs text-brand-burgundy underline hover:text-brand-burgundy-light"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Add Team Leader */}
        <section className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-brand-gold/20">
          <h2 className="font-heading text-2xl text-brand-burgundy mb-4">
            Add Team Leader
          </h2>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleAddLeader} className="grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="px-4 py-2.5 rounded-lg border border-brand-beige bg-brand-cream/50 focus:outline-none focus:ring-2 focus:ring-brand-gold text-brand-text"
              required
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="px-4 py-2.5 rounded-lg border border-brand-beige bg-brand-cream/50 focus:outline-none focus:ring-2 focus:ring-brand-gold text-brand-text"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="px-4 py-2.5 rounded-lg border border-brand-beige bg-brand-cream/50 focus:outline-none focus:ring-2 focus:ring-brand-gold text-brand-text"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="sm:col-span-3 bg-brand-burgundy text-brand-gold font-medium py-2.5 rounded-lg hover:bg-brand-burgundy-light transition-colors duration-200 tracking-wide disabled:opacity-60"
            >
              {submitting ? 'Adding...' : 'Add Team Leader'}
            </button>
          </form>
        </section>

        {/* Team Leaders List */}
        <section className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-brand-gold/20">
          <h2 className="font-heading text-2xl text-brand-burgundy mb-4">
            Team Leaders
          </h2>

          <div className="space-y-3">
            {loading && (
              <p className="text-brand-text/50 text-sm italic">Loading...</p>
            )}

            {!loading && leaders.length === 0 && (
              <p className="text-brand-text/50 text-sm italic">
                No team leaders added yet.
              </p>
            )}

            {leaders.map((leader) => (
              <div
                key={leader.id}
                className="flex items-center justify-between bg-brand-cream/50 rounded-lg px-4 py-3 border border-brand-beige"
              >
                <div>
                  <p className="font-body font-medium text-brand-text">
                    {leader.name}
                  </p>
                  <p className="font-body text-sm text-brand-text/50">
                    @{leader.username}
                  </p>
                </div>

                <button
                  onClick={() => removeLeader(leader.id)}
                  className="text-xs text-brand-burgundy underline hover:text-brand-burgundy-light"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div
          className="fixed inset-0 bg-brand-burgundy/40 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          onClick={() => setShowChangePassword(false)}
        >
          <div
            className="bg-brand-cream rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-brand-gold/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <h3 className="font-heading text-2xl text-brand-burgundy">
                Change Password
              </h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-brand-burgundy text-sm underline hover:text-brand-burgundy-light"
              >
                Close
              </button>
            </div>

            {passwordError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-brand-success bg-brand-success/10 border border-brand-success/30 rounded-lg px-3 py-2 mb-4">
                {passwordSuccess}
              </p>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-beige bg-white/60 focus:outline-none focus:ring-2 focus:ring-brand-gold text-brand-text"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-beige bg-white/60 focus:outline-none focus:ring-2 focus:ring-brand-gold text-brand-text"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full bg-brand-burgundy text-brand-gold font-medium py-2.5 rounded-lg hover:bg-brand-burgundy-light transition-colors duration-200 tracking-wide disabled:opacity-60"
              >
                {changingPassword ? 'Saving...' : 'Save New Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DirectorDashboard