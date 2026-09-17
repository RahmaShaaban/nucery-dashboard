import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function ManageTasks() {
  const [tasks, setTasks] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('task_templates')
      .select('*')
      .order('created_at', { ascending: true })
    setTasks(data || [])
    setLoading(false)
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setSubmitting(true)

    const { data, error } = await supabase
      .from('task_templates')
      .insert({ title: newTitle })
      .select()
      .single()

    if (!error && data) {
      setTasks((prev) => [...prev, data])
      setNewTitle('')
    }
    setSubmitting(false)
  }

  const removeTask = async (id) => {
    await supabase.from('task_templates').delete().eq('id', id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
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
              Manage Daily Tasks
            </p>
          </div>

          <Link
            to="/director-dashboard"
            className="bg-white/60 border border-brand-burgundy text-brand-burgundy font-medium px-5 py-2.5 rounded-lg hover:bg-white transition-colors duration-200 tracking-wide text-sm"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Add Task */}
        <section className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-brand-gold/20">
          <h2 className="font-heading text-2xl text-brand-burgundy mb-4">
            Add a Task Template
          </h2>

          <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Write a new task..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-brand-beige bg-brand-cream/50 focus:outline-none focus:ring-2 focus:ring-brand-gold text-brand-text"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-burgundy text-brand-gold font-medium px-6 py-2.5 sm:py-0 rounded-lg hover:bg-brand-burgundy-light transition-colors duration-200 disabled:opacity-60"
            >
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </form>
        </section>

        {/* Task List */}
        <section className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-brand-gold/20">
          <h2 className="font-heading text-2xl text-brand-burgundy mb-4">
            Current Tasks ({tasks.length})
          </h2>

          <div className="space-y-3">
            {loading && (
              <p className="text-brand-text/50 text-sm italic">Loading...</p>
            )}

            {!loading && tasks.length === 0 && (
              <p className="text-brand-text/50 text-sm italic">
                No tasks yet. Add one above.
              </p>
            )}

            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between bg-brand-cream/50 rounded-lg px-4 py-3 border border-brand-beige"
              >
                <p className="font-body text-brand-text">{task.title}</p>
                <button
                  onClick={() => removeTask(task.id)}
                  className="text-xs text-brand-burgundy underline hover:text-brand-burgundy-light"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default ManageTasks