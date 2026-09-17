import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function TeamLeaderDashboard() {
  const [leaderId, setLeaderId] = useState(null)
  const [leaderName, setLeaderName] = useState('')
  const [dailyTasks, setDailyTasks] = useState([])
  const [customTasks, setCustomTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [sales, setSales] = useState('')
  const [salesRowId, setSalesRowId] = useState(null)
  const [monthlySales, setMonthlySales] = useState(0)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const navigate = useNavigate()

  const today = getToday()

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
    const id = localStorage.getItem('leader_id')
    const name = localStorage.getItem('leader_name')

    if (!id) {
      navigate('/team-leader-login')
      return
    }

    setLeaderId(id)
    setLeaderName(name || '')
    loadData(id)
  }, [])

  const loadData = async (id) => {
    setLoading(true)

    const { data: existingDaily } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('team_leader_id', id)
      .eq('date', today)

    if (!existingDaily || existingDaily.length === 0) {
      const { data: templates } = await supabase
        .from('task_templates')
        .select('title')
        .order('created_at', { ascending: true })

      const rowsToInsert = (templates || []).map((t) => ({
        team_leader_id: id,
        title: t.title,
        date: today,
        completed: false,
      }))

      const { data: inserted } = await supabase
        .from('daily_tasks')
        .upsert(rowsToInsert, {
          onConflict: 'team_leader_id,date,title',
          ignoreDuplicates: true,
        })
        .select()

      const { data: finalDaily } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('team_leader_id', id)
        .eq('date', today)

      setDailyTasks(finalDaily || inserted || [])
    } else {
      setDailyTasks(existingDaily)
    }

    const { data: existingCustom } = await supabase
      .from('custom_tasks')
      .select('*')
      .eq('team_leader_id', id)
      .eq('date', today)

    setCustomTasks(existingCustom || [])

    const { data: existingSales } = await supabase
      .from('sales')
      .select('*')
      .eq('team_leader_id', id)
      .eq('date', today)
      .maybeSingle()

    if (existingSales) {
      setSales(String(existingSales.amount))
      setSalesRowId(existingSales.id)
    }

    // Monthly sales total
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      daysInMonth
    ).padStart(2, '0')}`

    const { data: monthSalesRows } = await supabase
      .from('sales')
      .select('amount')
      .eq('team_leader_id', id)
      .gte('date', monthStart)
      .lte('date', monthEnd)

    const total = (monthSalesRows || []).reduce(
      (sum, s) => sum + (s.amount || 0),
      0
    )
    setMonthlySales(total)

    setLoading(false)
  }

  const checkAllDone = (tasks) => {
    if (tasks.length > 0 && tasks.every((t) => t.completed)) {
      showToast('All tasks completed for today! ✓')
    } else {
      showToast('Saved')
    }
  }

  const toggleDailyTask = async (task) => {
    const newCompleted = !task.completed
    const updated = dailyTasks.map((t) =>
      t.id === task.id ? { ...t, completed: newCompleted } : t
    )
    setDailyTasks(updated)
    await supabase
      .from('daily_tasks')
      .update({ completed: newCompleted })
      .eq('id', task.id)
    checkAllDone(updated)
  }

  const toggleCustomTask = async (task) => {
    const newCompleted = !task.completed
    setCustomTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: newCompleted } : t))
    )
    await supabase
      .from('custom_tasks')
      .update({ completed: newCompleted })
      .eq('id', task.id)
    showToast('Saved')
  }

  const uploadPhoto = async (file) => {
  let fileToUpload = file

  try {
    const imageCompression = (await import('browser-image-compression')).default
    fileToUpload = await imageCompression(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    })
  } catch (compressionError) {
    console.error('Compression failed, uploading original file', compressionError)
    fileToUpload = file
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${leaderId}-${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('task-photos')
    .upload(fileName, fileToUpload)

  if (uploadError) {
    console.error(uploadError)
    showToast('Photo upload failed')
    return null
  }

  const { data } = supabase.storage.from('task-photos').getPublicUrl(fileName)
  return data.publicUrl
}

  const handleDailyPhoto = async (task, file) => {
    const url = await uploadPhoto(file)
    if (!url) return
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, photo_url: url } : t))
    )
    await supabase.from('daily_tasks').update({ photo_url: url }).eq('id', task.id)
    showToast('Photo saved')
  }

  const handleCustomPhoto = async (task, file) => {
    const url = await uploadPhoto(file)
    if (!url) return
    setCustomTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, photo_url: url } : t))
    )
    await supabase.from('custom_tasks').update({ photo_url: url }).eq('id', task.id)
    showToast('Photo saved')
  }

  const addCustomTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const { data, error } = await supabase
      .from('custom_tasks')
      .insert({
        team_leader_id: leaderId,
        title: newTaskTitle,
        date: today,
        completed: false,
      })
      .select()
      .single()

    if (!error && data) {
      setCustomTasks((prev) => [...prev, data])
      setNewTaskTitle('')
      showToast('Task added')
    }
  }

  const handleSaveSales = async (e) => {
    e.preventDefault()
    const amount = Math.max(0, parseInt(sales, 10) || 0)

    const previousAmount = salesRowId
      ? parseInt(
          (await supabase.from('sales').select('amount').eq('id', salesRowId).single())
            .data?.amount || 0,
          10
        )
      : 0

    if (salesRowId) {
      await supabase.from('sales').update({ amount }).eq('id', salesRowId)
      setMonthlySales((prev) => prev - previousAmount + amount)
    } else {
      const { data } = await supabase
        .from('sales')
        .insert({ team_leader_id: leaderId, date: today, amount })
        .select()
        .single()
      if (data) {
        setSalesRowId(data.id)
        setMonthlySales((prev) => prev + amount)
      }
    }
    showToast('Sales saved')
  }

  const handleLogout = () => {
    localStorage.removeItem('leader_id')
    localStorage.removeItem('leader_name')
    navigate('/team-leader-login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <p className="text-brand-text/50 font-body">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div className="text-center flex-1">
            <h1 className="font-heading text-4xl text-brand-burgundy tracking-wide">
              Nucery
            </h1>
            <p className="text-brand-text/60 font-body text-sm tracking-widest uppercase mt-1">
              {leaderName ? `Welcome, ${leaderName}` : 'Team Leader Dashboard'}
            </p>
            <p className="text-brand-text/40 font-body text-xs mt-1">
              {new Date().toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-brand-burgundy underline hover:text-brand-burgundy-light"
          >
            Logout
          </button>
        </div>

        {/* Daily Tasks */}
        <section className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-brand-gold/20">
          <h2 className="font-heading text-2xl text-brand-burgundy mb-4">
            Today's Tasks
          </h2>
          <div className="space-y-3">
            {dailyTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => toggleDailyTask(task)}
                onPhotoUpload={(file) => handleDailyPhoto(task, file)}
              />
            ))}
          </div>
        </section>

        {/* Custom Tasks */}
        <section className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-brand-gold/20">
          <h2 className="font-heading text-2xl text-brand-burgundy mb-4">
            Add a Task
          </h2>

          <form onSubmit={addCustomTask} className="flex gap-3 mb-5">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Write a new task..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-brand-beige bg-brand-cream/50 focus:outline-none focus:ring-2 focus:ring-brand-gold text-brand-text"
            />
            <button
              type="submit"
              className="bg-brand-burgundy text-brand-gold font-medium px-6 rounded-lg hover:bg-brand-burgundy-light transition-colors duration-200"
            >
              Add
            </button>
          </form>

          <div className="space-y-3">
            {customTasks.length === 0 && (
              <p className="text-brand-text/50 text-sm italic">No custom tasks yet.</p>
            )}
            {customTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => toggleCustomTask(task)}
                onPhotoUpload={(file) => handleCustomPhoto(task, file)}
              />
            ))}
          </div>
        </section>

        {/* Sales */}
        <section className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-brand-gold/20">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-heading text-2xl text-brand-burgundy">
              Today's Sales
            </h2>
            <span className="text-xs font-body text-brand-text/50 bg-brand-cream/70 px-3 py-1 rounded-full border border-brand-beige">
              This month: <span className="font-medium text-brand-burgundy">{monthlySales}</span> sales
            </span>
          </div>
          <form onSubmit={handleSaveSales} className="flex gap-3">
            <input
              type="number"
              min="0"
              value={sales}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || Number(val) >= 0) {
                  setSales(val)
                }
              }}
              placeholder="Number of sales"
              className="flex-1 px-4 py-2.5 rounded-lg border border-brand-beige bg-brand-cream/50 focus:outline-none focus:ring-2 focus:ring-brand-gold text-brand-text"
            />
            <button
              type="submit"
              className="bg-brand-burgundy text-brand-gold font-medium px-6 rounded-lg hover:bg-brand-burgundy-light transition-colors duration-200"
            >
              Save
            </button>
          </form>
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-burgundy text-brand-gold text-sm font-body px-5 py-2.5 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}

function TaskItem({ task, onToggle, onPhotoUpload }) {
  return (
    <div className="flex items-center justify-between bg-brand-cream/50 rounded-lg px-4 py-3 border border-brand-beige">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={onToggle}
          className="w-5 h-5 accent-brand-burgundy cursor-pointer"
        />
        <span
          className={`font-body text-brand-text ${
            task.completed ? 'line-through text-brand-text/40' : ''
          }`}
        >
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {task.photo_url && (
          <img
            src={task.photo_url}
            alt="task"
            className="w-8 h-8 rounded object-cover border border-brand-gold/30"
          />
        )}
        <label className="text-xs text-brand-burgundy underline cursor-pointer">
          {task.photo_url ? 'Change photo' : 'Add photo'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) onPhotoUpload(e.target.files[0])
            }}
          />
        </label>
      </div>
    </div>
  )
}

export default TeamLeaderDashboard