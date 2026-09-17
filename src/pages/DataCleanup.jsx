import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function getPreviousMonthRange() {
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthEnd = new Date(currentMonthStart - 1)
  const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1)

  const format = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const monthLabel = prevMonthStart.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return {
    start: format(prevMonthStart),
    end: format(prevMonthEnd),
    label: monthLabel,
  }
}

function DataCleanup() {
  const { start, end, label } = getPreviousMonthRange()
  const [status, setStatus] = useState('')
  const [working, setWorking] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const extractFileName = (url) => {
    if (!url) return null
    const parts = url.split('/task-photos/')
    return parts[1] || null
  }

  const handleCleanup = async () => {
    setWorking(true)
    setStatus('Starting cleanup...')

    try {
      // 1. Collect photo URLs from daily_tasks and custom_tasks for the previous month
      const { data: dailyRows } = await supabase
        .from('daily_tasks')
        .select('id, photo_url')
        .gte('date', start)
        .lte('date', end)

      const { data: customRows } = await supabase
        .from('custom_tasks')
        .select('id, photo_url')
        .gte('date', start)
        .lte('date', end)

      const photoFileNames = [
        ...(dailyRows || []),
        ...(customRows || []),
      ]
        .map((r) => extractFileName(r.photo_url))
        .filter(Boolean)

      // 2. Delete photos from Storage
      if (photoFileNames.length > 0) {
        setStatus(`Deleting ${photoFileNames.length} photos...`)
        await supabase.storage.from('task-photos').remove(photoFileNames)
      }

      // 3. Delete daily_tasks, custom_tasks, sales rows for the previous month
      setStatus('Deleting task records...')
      await supabase.from('daily_tasks').delete().gte('date', start).lte('date', end)
      await supabase.from('custom_tasks').delete().gte('date', start).lte('date', end)
      await supabase.from('sales').delete().gte('date', start).lte('date', end)

      setStatus(`Cleanup complete. ${label} data has been removed.`)
    } catch (err) {
      console.error(err)
      setStatus('Something went wrong. Please try again.')
    }

    setWorking(false)
    setConfirmOpen(false)
  }

  return (
    <div className="min-h-screen bg-brand-cream px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-4xl text-brand-burgundy tracking-wide">
              Nucery
            </h1>
            <p className="text-brand-text/60 font-body text-sm tracking-widest uppercase mt-1">
              Data Cleanup
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
          <h2 className="font-heading text-2xl text-brand-burgundy mb-3">
            Clear Previous Month's Data
          </h2>

          <p className="text-sm text-brand-text/60 font-body mb-1">
            This will permanently delete all daily tasks, custom tasks, sales
            records, and uploaded photos for:
          </p>
          <p className="text-brand-burgundy font-medium font-body mb-5">
            {label} ({start} to {end})
          </p>

          <p className="text-xs text-brand-text/50 font-body mb-6 italic">
            This does not affect the current month's data. Run this once at the
            start of each new month to keep storage usage low.
          </p>

          {status && (
            <p className="text-sm bg-brand-cream/70 border border-brand-beige rounded-lg px-3 py-2 mb-4 font-body text-brand-text">
              {status}
            </p>
          )}

          {!confirmOpen ? (
            <button
              onClick={() => setConfirmOpen(true)}
              className="bg-brand-burgundy text-brand-gold font-medium px-6 py-2.5 rounded-lg hover:bg-brand-burgundy-light transition-colors duration-200 tracking-wide"
            >
              Clear {label} Data
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm text-red-600 font-body w-full">
                Are you sure? This cannot be undone.
              </p>
              <button
                onClick={handleCleanup}
                disabled={working}
                className="bg-red-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-60"
              >
                {working ? 'Deleting...' : 'Yes, delete it'}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={working}
                className="bg-white/60 border border-brand-burgundy text-brand-burgundy font-medium px-6 py-2.5 rounded-lg hover:bg-white transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default DataCleanup