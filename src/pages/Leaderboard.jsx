import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatFullDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const rankStyles = {
  0: {
    card: 'bg-gradient-to-r from-brand-gold/25 via-brand-gold/10 to-transparent border-brand-gold shadow-md shadow-brand-gold/20',
    badge: 'bg-gradient-to-r from-yellow-300 via-brand-gold to-yellow-500 text-white shadow-sm shadow-brand-gold/40',
    label: 'Golden',
    number: 'text-brand-gold',
  },
  1: {
    card: 'bg-gradient-to-r from-gray-200/70 via-gray-100/60 to-transparent border-gray-300 shadow-md shadow-gray-300/30',
    badge: 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-white shadow-sm shadow-gray-400/40',
    label: 'Silver',
    number: 'text-gray-500',
  },
  2: {
    card: 'bg-gradient-to-r from-orange-100/80 via-orange-50/60 to-transparent border-orange-300 shadow-md shadow-orange-300/30',
    badge: 'bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 text-white shadow-sm shadow-orange-400/40',
    label: 'Bronze',
    number: 'text-orange-500',
  },
}

function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const today = getToday()

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setLoading(true)

    const { data: leaders } = await supabase.from('team_leaders').select('*')

    if (!leaders || leaders.length === 0) {
      setRows([])
      setLoading(false)
      return
    }

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      daysInMonth
    ).padStart(2, '0')}`

    const results = await Promise.all(
      leaders.map(async (leader) => {
        const { data: monthSalesRows } = await supabase
          .from('sales')
          .select('date, amount')
          .eq('team_leader_id', leader.id)
          .gte('date', monthStart)
          .lte('date', monthEnd)

        const todaySales =
          (monthSalesRows || []).find((s) => s.date === today)?.amount || 0

        const monthlySales = (monthSalesRows || []).reduce(
          (sum, s) => sum + (s.amount || 0),
          0
        )

        const { data: dailyTasks } = await supabase
          .from('daily_tasks')
          .select('completed')
          .eq('team_leader_id', leader.id)
          .eq('date', today)

        const allTasksCompleted =
          dailyTasks && dailyTasks.length > 0
            ? dailyTasks.every((t) => t.completed)
            : false

        return {
          id: leader.id,
          name: leader.name,
          username: leader.username,
          sales: todaySales,
          monthlySales,
          allTasksCompleted,
        }
      })
    )

    results.sort((a, b) => b.sales - a.sales)
    setRows(results)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-brand-cream px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-4xl text-brand-burgundy tracking-wide">
              Nucery
            </h1>
            <p className="text-brand-text/60 font-body text-sm tracking-widest uppercase mt-1">
              Leaderboard — {formatFullDate(today)}
            </p>
          </div>

          <Link
            to="/director-dashboard"
            className="bg-white/60 border border-brand-burgundy text-brand-burgundy font-medium px-5 py-2.5 rounded-lg hover:bg-white transition-colors duration-200 tracking-wide text-sm"
          >
            Back to Dashboard
          </Link>
        </div>

        <section className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-brand-gold/20">
          <h2 className="font-heading text-2xl text-brand-burgundy mb-6">
            Top Team Leaders
          </h2>

          <div className="space-y-3">
            {loading && (
              <p className="text-brand-text/50 text-sm italic">Loading...</p>
            )}

            {!loading && rows.length === 0 && (
              <p className="text-brand-text/50 text-sm italic">
                No team leaders yet.
              </p>
            )}

            {rows.map((leader, index) => {
              const style = rankStyles[index]
              return (
                <div
                  key={leader.id}
                  className={`flex items-center justify-between rounded-lg px-4 py-4 border ${
                    style ? style.card : 'bg-white/40 border-brand-beige/60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-heading text-2xl w-8 text-center ${
                        style ? style.number : 'text-brand-burgundy/40'
                      }`}
                    >
                      {index + 1}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-body font-medium text-brand-text">
                          {leader.name}
                        </p>
                        {style && (
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style.badge}`}
                          >
                            {style.label}
                          </span>
                        )}
                      </div>
                      <p className="font-body text-sm text-brand-text/50">
                        @{leader.username}
                      </p>
                      <p className="font-body text-xs text-brand-text/40 mt-0.5">
                        This month: {leader.monthlySales} sales
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {leader.allTasksCompleted && (
                      <span className="text-xs font-medium text-brand-success bg-brand-success/10 px-3 py-1 rounded-full border border-brand-success/30">
                        All tasks done
                      </span>
                    )}

                    <span className="font-heading text-xl text-brand-burgundy">
                      {leader.sales}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Leaderboard