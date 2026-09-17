import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function getMonthInfo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = now.toLocaleString('en-US', { month: 'long' })
  return { year, month, daysInMonth, monthName }
}

function getTodayFormatted() {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function buildWeeks(daysInMonth) {
  const ranges = [
    [1, 7],
    [8, 14],
    [15, 21],
    [22, daysInMonth],
  ]
  return ranges.map(([start, end], i) => ({
    label: `Week ${i + 1}`,
    range: [start, end],
  }))
}

function groupByDate(rows) {
  const map = {}
  ;(rows || []).forEach((r) => {
    if (!map[r.date]) map[r.date] = []
    map[r.date].push(r)
  })
  return map
}

const statusStyles = {
  done: 'bg-brand-success text-white',
  partial: 'bg-brand-gold text-white',
  missed: 'bg-brand-burgundy/15 text-brand-burgundy/40',
}

const statusLabels = {
  done: 'All tasks done',
  partial: 'Partial activity',
  missed: "Didn't check activity",
}

function MonthlyPerformance() {
  const { year, month, daysInMonth, monthName } = getMonthInfo()
  const weeks = buildWeeks(daysInMonth)

  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDetail, setSelectedDetail] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const { data: teamLeaders } = await supabase.from('team_leaders').select('*')

    if (!teamLeaders || teamLeaders.length === 0) {
      setLeaders([])
      setLoading(false)
      return
    }

    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      daysInMonth
    ).padStart(2, '0')}`

    const results = await Promise.all(
      teamLeaders.map(async (leader) => {
        const { data: tasks } = await supabase
          .from('daily_tasks')
          .select('id, date, title, completed, photo_url')
          .eq('team_leader_id', leader.id)
          .gte('date', monthStart)
          .lte('date', monthEnd)

        const { data: customs } = await supabase
          .from('custom_tasks')
          .select('id, date, title, completed, photo_url')
          .eq('team_leader_id', leader.id)
          .gte('date', monthStart)
          .lte('date', monthEnd)

        const tasksByDate = groupByDate(tasks)
        const customsByDate = groupByDate(customs)

        const days = Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
            dayNum
          ).padStart(2, '0')}`

          const dayTasks = tasksByDate[dateStr] || []

          if (dayTasks.length === 0) return 'missed'
          const allDone = dayTasks.every((t) => t.completed)
          const someDone = dayTasks.some((t) => t.completed)

          if (allDone) return 'done'
          if (someDone) return 'partial'
          return 'missed'
        })

        return { id: leader.id, name: leader.name, days, tasksByDate, customsByDate }
      })
    )

    setLeaders(results)
    setLoading(false)
  }

  const openDayDetail = (leader, dayNum) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      dayNum
    ).padStart(2, '0')}`

    setSelectedDetail({
      leaderName: leader.name,
      dateStr,
      tasks: leader.tasksByDate[dateStr] || [],
      customs: leader.customsByDate[dateStr] || [],
    })
  }

  return (
    <div className="min-h-screen bg-brand-cream px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-4xl text-brand-burgundy tracking-wide">
              Nucery
            </h1>
            <p className="text-brand-text/60 font-body text-sm tracking-widest uppercase mt-1">
              Monthly Performance — {monthName} {year}
            </p>
            <p className="text-brand-text/40 font-body text-xs mt-1">
              Today: {getTodayFormatted()}
            </p>
          </div>

          <Link
            to="/director-dashboard"
            className="bg-white/60 border border-brand-burgundy text-brand-burgundy font-medium px-5 py-2.5 rounded-lg hover:bg-white transition-colors duration-200 tracking-wide text-sm"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded ${statusStyles[key]}`}></span>
              <span className="text-sm text-brand-text/70 font-body">{label}</span>
            </div>
          ))}
          <span className="text-xs text-brand-text/40 font-body italic">
            Click any day to see task details
          </span>
        </div>

        {loading && (
          <p className="text-brand-text/50 text-sm italic">Loading...</p>
        )}

        {!loading && leaders.length === 0 && (
          <p className="text-brand-text/50 text-sm italic">
            No team leaders yet.
          </p>
        )}

        {/* Board per leader */}
        <div className="space-y-8">
          {leaders.map((leader) => (
            <section
              key={leader.id}
              className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-brand-gold/20"
            >
              <h2 className="font-heading text-2xl text-brand-burgundy mb-4">
                {leader.name}
              </h2>

              {weeks.map((week) => {
                const [start, end] = week.range
                const weekDays = leader.days.slice(start - 1, end)
                const doneCount = weekDays.filter((d) => d === 'done').length

                return (
                  <div key={week.label} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-body text-sm font-medium text-brand-text/70">
                        {week.label}{' '}
                        <span className="text-brand-text/40">
                          ({monthName.slice(0, 3)} {start}–{end})
                        </span>
                      </p>
                      <p className="font-body text-xs text-brand-success font-medium">
                        {doneCount}/{weekDays.length} days completed
                      </p>
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      {weekDays.map((status, i) => (
                        <button
                          key={i}
                          onClick={() => openDayDetail(leader, start + i)}
                          title={`${monthName} ${start + i} — ${statusLabels[status]}`}
                          className={`w-9 h-9 rounded-md flex items-center justify-center text-xs font-body font-medium cursor-pointer hover:opacity-80 transition-opacity ${statusStyles[status]}`}
                        >
                          {start + i}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      </div>

      <DayDetailModal detail={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  )
}

function DayDetailModal({ detail, onClose }) {
  if (!detail) return null
  const { leaderName, dateStr, tasks, customs } = detail

  return (
    <div
      className="fixed inset-0 bg-brand-burgundy/40 backdrop-blur-sm flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-brand-cream rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 border border-brand-gold/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-heading text-2xl text-brand-burgundy">{leaderName}</h3>
            <p className="text-sm text-brand-text/50 font-body">{dateStr}</p>
          </div>
          <button
            onClick={onClose}
            className="text-brand-burgundy text-sm underline hover:text-brand-burgundy-light"
          >
            Close
          </button>
        </div>

        <h4 className="font-body text-xs font-semibold text-brand-text/60 uppercase tracking-widest mb-2">
          Daily Tasks
        </h4>
        {tasks.length === 0 && (
          <p className="text-sm text-brand-text/40 italic mb-5">
            No tasks recorded for this day.
          </p>
        )}
        <div className="space-y-2 mb-5">
          {tasks.map((t) => (
            <TaskDetailRow key={t.id} task={t} />
          ))}
        </div>

        {customs.length > 0 && (
          <>
            <h4 className="font-body text-xs font-semibold text-brand-text/60 uppercase tracking-widest mb-2">
              Custom Tasks
            </h4>
            <div className="space-y-2">
              {customs.map((t) => (
                <TaskDetailRow key={t.id} task={t} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TaskDetailRow({ task }) {
  return (
    <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2.5 border border-brand-beige">
      <span
        className={`font-body text-sm ${
          task.completed ? 'text-brand-text' : 'text-brand-text/50'
        }`}
      >
        {task.title}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            task.completed
              ? 'bg-brand-success/10 text-brand-success'
              : 'bg-brand-burgundy/10 text-brand-burgundy/50'
          }`}
        >
          {task.completed ? 'Done' : 'Not done'}
        </span>
        {task.photo_url && (
          <a href={task.photo_url} target="_blank" rel="noreferrer">
            <img
              src={task.photo_url}
              alt="proof"
              className="w-8 h-8 rounded object-cover border border-brand-gold/30"
            />
          </a>
        )}
      </div>
    </div>
  )
}

export default MonthlyPerformance