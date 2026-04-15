import { useState, useEffect, useRef } from 'react'
import { Heart, Bell, Home, Calendar, BarChart2, Activity, User, LogOut,
  CheckCircle2, Circle, AlertTriangle, Trophy, X, Clock, Pill,
  TrendingUp, Droplets, Wind, Footprints, Clipboard, ThermometerSun, ShieldCheck, Trash2, Plus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ProfileForm from './ProfileForm'
import { CONDITION_TASKS, getMissedMeds, getUpcomingMed } from '../data/conditionTasks'
import { loadFromLocalStorage, saveToLocalStorage } from './storage'

// ── helpers ──────────────────────────────────────────────────────────────────
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`
}

function progressRingPath(pct, r = 54) {
  const circ = 2 * Math.PI * r
  return { circ, dash: (pct / 100) * circ }
}

// Compute streak by walking backwards through history
function computeStreak(username) {
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const h = (() => { try { const v = localStorage.getItem(`careCompanionHistory_${username}_${dateStr}`); return v ? JSON.parse(v) : null } catch { return null } })()
    if (h && h.pct > 0) {
      streak++
    } else if (i > 0) {
      // gap found — stop (allow today to be in-progress)
      break
    }
  }
  return streak
}

// Returns true if a med is active on the given date string (YYYY-MM-DD)
function isMedActive(med, dateStr) {
  if (!med.endDate) return true
  return dateStr <= med.endDate
}


function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition
        ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
      <Icon size={18} /> {label}
    </button>
  )
}

function ProgressRing({ pct }) {
  const { circ, dash } = progressRingPath(pct)
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle cx="60" cy="60" r="54" fill="none" stroke="#2563eb" strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-800">{pct}%</span>
        <span className="text-xs text-slate-400 font-medium">Complete</span>
      </div>
    </div>
  )
}

function MiniCalendar({ username }) {
  const today = new Date()
  const year = today.getFullYear(), month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const todayDate = today.getDate()
  // Build set of completed day-of-month numbers from history
  const completedDays = new Set()
  for (let d = 1; d <= todayDate; d++) {
    const date = new Date(year, month, d)
    const dateStr = date.toISOString().slice(0, 10)
    try {
      const h = JSON.parse(localStorage.getItem(`careCompanionHistory_${username}_${dateStr}`))
      if (h && h.pct > 0) completedDays.add(d)
    } catch {}
  }
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' })
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{monthName}</p>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-slate-400 mb-1">
        {['S','M','T','W','T','F','S'].map((d,i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {cells.map((d, i) => (
          <div key={i} className={`w-6 h-6 mx-auto flex items-center justify-center rounded-full font-medium
            ${d === todayDate ? 'bg-blue-600 text-white text-xs' : ''}
            ${d && d !== todayDate && completedDays.has(d) ? 'bg-green-100 text-green-700' : ''}
            ${d && d !== todayDate && !completedDays.has(d) ? 'text-slate-500' : ''}
          `}>{d || ''}</div>
        ))}
      </div>
    </div>
  )
}

// ── Home Tab ──────────────────────────────────────────────────────────────────
function HomeTab({ profile, checked, onToggle, streak, missedMeds, upcoming }) {
  const today = new Date().toISOString().slice(0, 10)
  const deletedRoutines = profile.deletedRoutines || []
  const condTasks = (CONDITION_TASKS[profile.condition] || []).filter(t => !deletedRoutines.includes(t.id))
  const medTasks = profile.meds
    .filter(m => isMedActive(m, today))
    .map(m => ({ id: `med_${m.name}`, label: `Take ${m.name}`, time: m.time, type: 'med' }))
  const allTasks = [...condTasks, ...medTasks]
  const done = Object.values(checked).filter(Boolean).length
  const total = allTasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Alert banner */}
      {missedMeds.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3" role="alert">
          <AlertTriangle className="text-red-500 shrink-0" size={18} />
          <span className="text-red-700 text-sm font-semibold">
            ALERT: Missed {missedMeds.map(m => `${fmtTime(m.time)} ${m.name} dosage`).join(', ')}
          </span>
        </div>
      )}
      {upcoming && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <Bell className="text-blue-500 shrink-0" size={18} />
          <span className="text-blue-700 text-sm font-semibold">
            NOTIFICATION: Next — {upcoming.name} in {upcoming.diffMin} mins ({fmtTime(upcoming.time)})
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Progress Ring */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">Today's Progress Ring</h3>
          <ProgressRing pct={pct} />
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-slate-800">{profile.meds.filter(m => checked[`med_${m.name}`]).length}/{profile.meds.length}</p>
              <p className="text-slate-400 text-xs">Meds</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-800">{condTasks.filter(t => checked[t.id]).length}/{condTasks.length}</p>
              <p className="text-slate-400 text-xs">Routine</p>
            </div>
          </div>
        </div>

        {/* Next Up */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Next Up</h3>
            <span className="text-xs text-slate-400">{new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
          </div>
          {upcoming ? (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-slate-500 mb-1">Next: <span className="font-bold text-slate-800">{upcoming.name}</span> in <span className="text-blue-600 font-bold">{upcoming.diffMin} mins</span></p>
              <p className="text-xs text-slate-400 mb-3">{fmtTime(upcoming.time)} · Before Meal</p>
              <div className="flex items-center gap-2">
                <Pill size={14} className="text-blue-500" />
                <span className="text-xs text-slate-500">Status: <span className="text-amber-600 font-semibold">PENDING</span></span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-sm">
              <CheckCircle2 className="mx-auto mb-2 text-green-400" size={28} />
              All upcoming meds are on track!
            </div>
          )}
          <div className="mt-4 space-y-2">
            {allTasks.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-50 pb-1">
                <span>{t.label}</span>
                <span className={checked[t.id] ? 'text-green-500 font-semibold' : 'text-amber-500 font-semibold'}>
                  {checked[t.id] ? 'Done' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Checklist */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Daily Checklist</h3>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{done}/{total} done</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 mb-5">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allTasks.map(task => {
            const isDone = !!checked[task.id]
            return (
              <button key={task.id} onClick={() => onToggle(task.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition
                  ${isDone ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                aria-pressed={isDone}>
                {isDone ? <CheckCircle2 className="text-green-500 shrink-0" size={18} /> : <Circle className="text-slate-300 shrink-0" size={18} />}
                <div>
                  <p className={`text-sm font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.label}</p>
                  {task.time && <p className="text-xs text-slate-400">{fmtTime(task.time)}</p>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function ManageModal({ profile, allCondTasks, deletedRoutines, onUpdateMeds, onUpdateRoutines, onClose, onAddNew }) {
  const [editIdx, setEditIdx] = useState(null)
  const [editForm, setEditForm] = useState(null)

  const startEdit = (i) => {
    const m = profile.meds[i]
    const times = m.times?.length ? m.times : (m.time ? [m.time] : [''])
    setEditForm({ name: m.name, times, days: [...m.days], endDate: m.endDate || '' })
    setEditIdx(i)
  }

  const saveEdit = () => {
    const validTimes = editForm.times.filter(t => t)
    if (!editForm.name.trim() || validTimes.length === 0 || editForm.days.length === 0) return
    const updated = profile.meds.map((m, i) =>
      i === editIdx ? { ...m, name: editForm.name.trim(), time: validTimes[0], times: validTimes, days: editForm.days, endDate: editForm.endDate || '' } : m
    )
    onUpdateMeds(updated)
    setEditIdx(null)
    setEditForm(null)
  }

  const toggleDay = (day) => {
    setEditForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day]
    }))
  }

  const updateTime = (ti, val) => setEditForm(f => { const t = [...f.times]; t[ti] = val; return { ...f, times: t } })
  const addTime = () => setEditForm(f => ({ ...f, times: [...f.times, ''] }))
  const removeTime = (ti) => setEditForm(f => ({ ...f, times: f.times.filter((_, i) => i !== ti) }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Manage Schedules</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Medications */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Medications</p>
            {profile.meds.length === 0 ? (
              <p className="text-slate-400 text-sm py-2">No medications added yet.</p>
            ) : (
              <div className="space-y-2">
                {profile.meds.map((m, i) => (
                  <div key={i}>
                    {editIdx === i ? (
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Medicine Name</label>
                          <input type="text" value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Time(s)</label>
                          <div className="space-y-1.5">
                            {editForm.times.map((t, ti) => (
                              <div key={ti} className="flex items-center gap-2">
                                <input type="time" value={t}
                                  onChange={e => updateTime(ti, e.target.value)}
                                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                                {editForm.times.length > 1 && (
                                  <button type="button" onClick={() => removeTime(ti)}
                                    className="text-slate-300 hover:text-red-500 transition p-1">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button type="button" onClick={addTime}
                              className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-800 transition pt-0.5">
                              <Plus size={13} /> Add Time
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Days</label>
                          <div className="flex flex-wrap gap-1.5">
                            {DAYS.map(day => (
                              <button key={day} type="button" onClick={() => toggleDay(day)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition
                                  ${editForm.days.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Take Until <span className="text-slate-400 font-normal">— optional</span></label>
                          <input type="date" value={editForm.endDate || ''}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                          {editForm.endDate && (
                            <p className="text-xs text-slate-400 mt-1">Until {new Date(editForm.endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          )}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={saveEdit}
                            className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition">
                            Save
                          </button>
                          <button onClick={() => { setEditIdx(null); setEditForm(null) }}
                            className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <Pill className="text-blue-600" size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{m.name}</p>
                          <p className="text-xs text-slate-400">{fmtTime(m.time)} · {m.days.join(', ')}{m.endDate ? ` · Until ${new Date(m.endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</p>
                        </div>
                        <button onClick={() => startEdit(i)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition" aria-label="Edit">
                          <Clipboard size={15} />
                        </button>
                        <button onClick={() => onUpdateMeds(profile.meds.filter((_, idx) => idx !== i))}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition" aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Condition Routines */}
          {allCondTasks.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Daily Routines — {profile.condition}</p>
              <div className="space-y-2">
                {allCondTasks.map(task => {
                  const isDeleted = deletedRoutines.includes(task.id)
                  return (
                    <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isDeleted ? 'bg-red-50 border-red-100 opacity-60' : 'bg-slate-50 border-slate-200'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDeleted ? 'bg-red-100' : 'bg-green-100'}`}>
                        <Activity className={isDeleted ? 'text-red-400' : 'text-green-600'} size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${isDeleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.label}</p>
                        <p className="text-xs text-slate-400">{isDeleted ? 'Removed' : 'Daily routine'}</p>
                      </div>
                      {isDeleted ? (
                        <button onClick={() => onUpdateRoutines(deletedRoutines.filter(id => id !== task.id))}
                          className="text-xs font-semibold px-2 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition">
                          Restore
                        </button>
                      ) : (
                        <button onClick={() => onUpdateRoutines([...deletedRoutines, task.id])}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition" aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3 pt-2">
          <button onClick={onAddNew}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2">
            <Plus size={16} /> Add New Schedule
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Schedule Tab ──────────────────────────────────────────────────────────────
function ScheduleTab({ profile, checked, onToggle, setTab, onUpdateMeds, onUpdateRoutines }) {
  const [showManage, setShowManage] = useState(false)
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => new Date().getDay())
  const [weekOffset, setWeekOffset] = useState(0)

  const today = new Date()
  const todayDayIdx = today.getDay()

  // Build the week based on offset (0 = current week)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - todayDayIdx + weekOffset * 7)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i)
    const isToday = d.toDateString() === today.toDateString()
    return { label: DAYS_SHORT[i], date: d.getDate(), fullDate: d, isToday, dayIdx: i }
  })

  const selectedDay = weekDays[selectedDayIdx] || weekDays[todayDayIdx]
  const selectedDayName = DAYS_SHORT[selectedDayIdx] // e.g. 'Mon'

  const allCondTasks = CONDITION_TASKS[profile.condition] || []
  const deletedRoutines = profile.deletedRoutines || []
  const condTasks = allCondTasks.filter(t => !deletedRoutines.includes(t.id))

  // Filter meds that are scheduled for the selected day; show all meds on today; respect endDate
  const selectedDateStr = selectedDay.fullDate.toISOString().slice(0, 10)
  const medTasks = profile.meds
    .filter(m => isMedActive(m, selectedDateStr) && (selectedDay.isToday || m.days.includes(selectedDayName)))
    .map(m => ({ id: `med_${m.name}`, label: `Take ${m.name}`, time: m.time, type: 'med' }))
  const allTasks = [...medTasks, ...condTasks]

  const handleDeleteMed = (index) => {
    onUpdateMeds(profile.meds.filter((_, i) => i !== index))
  }

  const handleDeleteRoutine = (taskId) => {
    onUpdateRoutines([...deletedRoutines, taskId])
  }

  return (
    <div className="space-y-5">
      {/* Week strip with navigation */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition shrink-0">
            ‹
          </button>
          <div className="flex gap-1 flex-1 justify-between">
            {weekDays.map((d, i) => (
              <button key={i} onClick={() => setSelectedDayIdx(i)}
                className={`flex flex-col items-center px-2 py-2 rounded-xl text-sm font-semibold transition flex-1
                  ${i === selectedDayIdx ? 'bg-blue-600 text-white shadow-md' : d.isToday ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span className="text-xs">{d.label}</span>
                <span className="text-base font-bold">{d.date}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setWeekOffset(w => w + 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition shrink-0">
            ›
          </button>
        </div>
        <div className="flex items-center justify-center gap-3 mt-3">
          <p className="text-xs text-slate-400">
            {selectedDay.fullDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {selectedDay.isToday && <span className="ml-2 text-blue-500 font-semibold">· Today</span>}
          </p>
          {!selectedDay.isToday && (
            <button onClick={() => { setWeekOffset(0); setSelectedDayIdx(todayDayIdx) }}
              className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition">
              Today
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Selected day's schedule */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4">
            {selectedDay.isToday ? "Today's Schedule" : `${selectedDay.fullDate.toLocaleDateString('en-IN', { weekday: 'long' })}'s Schedule`}
          </h3>
          <div className="space-y-3">
            {allTasks.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No tasks scheduled for this day.</p>
            ) : allTasks.map(task => {
              const isDone = selectedDay.isToday ? !!checked[task.id] : false
              return (
                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border transition
                  ${isDone ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs text-slate-400 w-16 shrink-0 pt-0.5">{task.time ? fmtTime(task.time) : '—'}</div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.label}</p>
                    {task.type === 'med' && <p className="text-xs text-slate-400 mt-0.5">Dosage · Before Meal · Status: <span className={isDone ? 'text-green-600' : 'text-amber-600'}>{isDone ? 'DONE' : 'PENDING'}</span></p>}
                  </div>
                  {selectedDay.isToday && (
                    <button onClick={() => onToggle(task.id)}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg border transition
                        ${isDone ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
                      {isDone ? 'Done ✓' : 'Mark Done'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Medication Management */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4">Medication Management</h3>
          <div className="space-y-3">
            {profile.meds.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Pill className="text-blue-600" size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{m.name}</p>
                  <p className="text-xs text-slate-400">{fmtTime(m.time)} · {m.days.join(', ')}{m.endDate ? ` · Until ${new Date(m.endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowManage(true)} className="mt-4 w-full py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition">
            Manage Schedules
          </button>
          <button onClick={() => setTab('profile')} className="mt-2 w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">
            + Add Medication / Routine
          </button>
        </div>
      </div>

      {/* Manage Schedules Modal */}
      {showManage && (
        <ManageModal
          profile={profile}
          allCondTasks={allCondTasks}
          deletedRoutines={deletedRoutines}
          onUpdateMeds={onUpdateMeds}
          onUpdateRoutines={onUpdateRoutines}
          onClose={() => setShowManage(false)}
          onAddNew={() => { setShowManage(false); setTab('profile') }}
        />
      )}
    </div>
  )
}

// ── Health Logs Tab ───────────────────────────────────────────────────────────
function HealthLogsTab({ username, todayDate }) {
  const [view, setView] = useState('today')
  const [vitals, setVitals] = useState({ sugar: '', heartRate: '', weight: '' })
  const [mood, setMood] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  const logsKey = `careCompanionVitalLogs_${username}`

  const scanPastLogs = () => {
    const all = loadFromLocalStorage(logsKey) || []
    return [...all].reverse() // newest first
  }

  const [pastLogs, setPastLogs] = useState(scanPastLogs)

  const moods = [
    { label: 'Happy', emoji: '😊' }, { label: 'Tired', emoji: '😴' },
    { label: 'Pain', emoji: '😣' }, { label: 'Dizzy', emoji: '😵' },
  ]

  const handleSave = () => {
    const hasData = vitals.sugar || vitals.heartRate || vitals.weight || mood || notes.trim()
    if (!hasData) return
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      vitals,
      mood,
      notes,
    }
    // Also mark vitalsLogged on the daily history for badge tracking
    const existing = loadFromLocalStorage(`careCompanionHistory_${username}_${todayDate}`) || {}
    saveToLocalStorage(`careCompanionHistory_${username}_${todayDate}`, { ...existing, vitalsLogged: true })
    // Append to the logs array
    const all = loadFromLocalStorage(logsKey) || []
    saveToLocalStorage(logsKey, [...all, entry])
    setPastLogs(scanPastLogs())
    // Clear fields
    setVitals({ sugar: '', heartRate: '', weight: '' })
    setMood('')
    setNotes('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-5">
      {/* Tab toggle */}
      <div className="flex gap-2">
        {[['today', 'Log Today'], ['history', 'Past Logs']].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition border
              ${view === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
            {label}
            {v === 'history' && pastLogs.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{pastLogs.length}</span>
            )}
          </button>
        ))}
      </div>

      {view === 'today' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Vital Tracking */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-5">Vital Tracking</h3>
            <div className="space-y-4">
              {[
                { label: 'Blood Sugar', key: 'sugar', unit: 'mg/dL', icon: Droplets },
                { label: 'Heart Rate', key: 'heartRate', unit: 'bpm', icon: Activity },
                { label: 'Weight', key: 'weight', unit: 'kg', icon: TrendingUp },
              ].map(({ label, key, unit, icon: Icon }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={vitals[key]}
                      onChange={e => setVitals({ ...vitals, [key]: e.target.value })}
                      placeholder="—"
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span className="text-xs text-slate-400 font-medium w-12">{unit}</span>
                    <Icon size={16} className="text-blue-400" />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleSave}
              className={`mt-5 w-full py-3 font-bold rounded-xl transition text-sm ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {saved ? '✓ Vitals Logged!' : 'Log Vitals'}
            </button>
          </div>

          {/* Symptom + Notes */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-5">Symptom Checker</h3>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {moods.map(m => (
                <button key={m.label} onClick={() => setMood(m.label)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition
                    ${mood === m.label ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-200'}`}>
                  <span className="text-2xl">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
            <h3 className="font-bold text-slate-800 mb-3">Daily Notes / Observations</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Jot down how you feel today, things to tell the doctor..."
              rows={5}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <button onClick={handleSave}
              className={`mt-3 w-full py-3 font-bold rounded-xl transition text-sm ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {saved ? '✓ Saved!' : 'Save Daily Log'}
            </button>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-5">Past Vital Logs</h3>
          {pastLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Activity size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No past logs found. Start logging your vitals today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastLogs.map(log => {
                const logDate = new Date(log.timestamp)
                return (
                  <div key={log.id} className="border border-slate-100 rounded-xl p-4 hover:border-blue-100 transition">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {logDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {logDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          {log.mood && <span> · {moods.find(m => m.label === log.mood)?.emoji} {log.mood}</span>}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full">
                        Saved
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Blood Sugar', key: 'sugar', unit: 'mg/dL', icon: Droplets, color: 'text-red-500' },
                        { label: 'Heart Rate', key: 'heartRate', unit: 'bpm', icon: Activity, color: 'text-pink-500' },
                        { label: 'Weight', key: 'weight', unit: 'kg', icon: TrendingUp, color: 'text-blue-500' },
                      ].map(({ label, key, unit, icon: Icon, color }) => (
                        <div key={key} className="bg-slate-50 rounded-lg p-3 text-center">
                          <Icon size={14} className={`mx-auto mb-1 ${color}`} />
                          <p className="text-base font-black text-slate-800">
                            {log.vitals?.[key] ? log.vitals[key] : <span className="text-slate-300 font-normal">—</span>}
                          </p>
                          <p className="text-xs text-slate-400">{unit}</p>
                        </div>
                      ))}
                    </div>
                    {log.notes && (
                      <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 italic">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Insights Tab ─────────────────────────────────────────────────────────────
function InsightsTab({ profile, checked, streak, username }) {
  const [view, setView] = useState('weekly')
  const [tooltipBadge, setTooltipBadge] = useState(null)

  const deletedRoutines = profile.deletedRoutines || []
  const condTasks = (CONDITION_TASKS[profile.condition] || []).filter(t => !deletedRoutines.includes(t.id))
  const totalMeds = profile.meds.length
  const doneMeds = profile.meds.filter(m => checked[`med_${m.name}`]).length
  const doneRoutine = condTasks.filter(t => checked[t.id]).length
  const total = totalMeds + condTasks.length
  const done = Object.values(checked).filter(Boolean).length
  const todayPct = total > 0 ? Math.round((done / total) * 100) : 0
  const todayMedPct = totalMeds > 0 ? Math.round((doneMeds / totalMeds) * 100) : 0
  const todayRoutinePct = condTasks.length > 0 ? Math.round((doneRoutine / condTasks.length) * 100) : 0
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const getHistory = (dateStr) => loadFromLocalStorage(`careCompanionHistory_${username}_${dateStr}`) || {}

  const weeklyData = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => {
    const jsDay = (i + 1) % 7
    const diff = jsDay - today.getDay()
    const date = new Date(today); date.setDate(today.getDate() + diff)
    const dateStr = date.toISOString().slice(0, 10)
    const isToday = dateStr === todayStr
    const h = isToday ? {} : getHistory(dateStr)
    return {
      day: d,
      Meds: isToday ? todayMedPct : (h.medPct ?? null),
      Routine: isToday ? todayRoutinePct : (h.routinePct ?? null),
    }
  })

  const monthlyData = Array.from({ length: 4 }, (_, i) => {
    const pcts = Array.from({ length: 7 }, (_, j) => {
      const date = new Date(today)
      date.setDate(today.getDate() - today.getDay() - (3 - i) * 7 + j)
      const dateStr = date.toISOString().slice(0, 10)
      const isToday = dateStr === todayStr
      const h = isToday ? { medPct: todayMedPct, routinePct: todayRoutinePct } : getHistory(dateStr)
      return h.medPct != null ? { med: h.medPct, routine: h.routinePct ?? 0 } : null
    }).filter(Boolean)
    return {
      week: `Wk ${i + 1}`,
      Meds: pcts.length ? Math.round(pcts.reduce((s, p) => s + p.med, 0) / pcts.length) : null,
      Routine: pcts.length ? Math.round(pcts.reduce((s, p) => s + p.routine, 0) / pcts.length) : null,
    }
  })

  const graphData = view === 'weekly' ? weeklyData : monthlyData
  const xKey = view === 'weekly' ? 'day' : 'week'

  const checkDays = (n, fn) => {
    for (let i = 0; i < n; i++) {
      const date = new Date(today); date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)
      const isToday = dateStr === todayStr
      const h = isToday ? { medPct: todayMedPct, routinePct: todayRoutinePct, pct: todayPct, missedMeds: getMissedMeds(profile.meds).length > 0 } : getHistory(dateStr)
      if (!fn(h)) return false
    }
    return true
  }

  const badges = [
    {
      icon: '🏅', title: '7-Day Streak', sub: 'Tasks 7 days in a row',
      unlocked: streak >= 7,
      condition: 'Complete all daily tasks for 7 consecutive days',
    },
    {
      icon: '💊', title: 'Med Master', sub: '100% meds 3 days',
      unlocked: (() => { let c = 0; for (let i = 0; i < 7; i++) { const d = new Date(today); d.setDate(today.getDate()-i); const s = d.toISOString().slice(0,10); const p = s===todayStr ? todayMedPct : (getHistory(s).medPct??0); if(p===100) c++; } return c>=3 })(),
      condition: 'Achieve 100% medication completion for 3 days',
    },
    {
      icon: '📋', title: 'Log Master', sub: 'Log vitals 5 days',
      unlocked: (() => { let c = 0; for (let i = 0; i < 30; i++) { const d = new Date(today); d.setDate(today.getDate()-i); const s = d.toISOString().slice(0,10); if(getHistory(s).vitalsLogged) c++; } return c>=5 })(),
      condition: 'Log your vitals on 5 different days',
    },
    {
      icon: '🔥', title: '30-Day Streak', sub: 'Tasks 30 days in a row',
      unlocked: streak >= 30,
      condition: 'Complete all daily tasks for 30 consecutive days',
    },
    {
      icon: '⏰', title: 'Punctual', sub: 'No missed meds 7 days',
      unlocked: streak >= 7 && checkDays(7, h => !h.missedMeds),
      condition: 'Have zero missed medications for 7 consecutive days',
    },
    {
      icon: '🌟', title: 'Perfect Week', sub: '100% all 7 days',
      unlocked: checkDays(7, h => (h.pct ?? 0) >= 100),
      condition: 'Achieve 100% task completion every day for a full week',
    },
  ]

  const handleExportPDF = () => {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>CareCompanion Health Report</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#1e293b}
        h1{color:#2563eb}h2{color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-top:24px}
        table{width:100%;border-collapse:collapse;margin:12px 0}
        th{background:#f1f5f9;text-align:left;padding:8px 12px;font-size:13px}
        td{padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}
        .badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;margin:4px}
        .unlocked{background:#dbeafe;color:#1d4ed8}.locked{background:#f1f5f9;color:#94a3b8}
      </style></head><body>
      <h1>CareCompanion Health Report</h1>
      <p>Patient: <strong>${profile.name}</strong> &nbsp;|&nbsp; Age: ${profile.age} &nbsp;|&nbsp; Condition: ${profile.condition}</p>
      <p>Generated: ${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
      <h2>Today's Adherence</h2>
      <table><tr><th>Category</th><th>Completion</th></tr>
        <tr><td>Medications</td><td>${todayMedPct}%</td></tr>
        <tr><td>Daily Routines</td><td>${todayRoutinePct}%</td></tr>
        <tr><td>Overall</td><td>${todayPct}%</td></tr>
      </table>
      <h2>Medications</h2>
      <table><tr><th>Name</th><th>Time</th><th>Days</th><th>Status</th></tr>
        ${profile.meds.map(m => `<tr><td>${m.name}</td><td>${m.time||'—'}</td><td>${m.days.join(', ')}</td><td>${checked[`med_${m.name}`]?'✓ Done':'Pending'}</td></tr>`).join('')}
      </table>
      <h2>Current Streak</h2><p>🔥 ${streak} day${streak!==1?'s':''}</p>
      <h2>Badges Earned</h2>
      <div>${badges.map(b=>`<span class="badge ${b.unlocked?'unlocked':'locked'}">${b.icon} ${b.title}</span>`).join('')}</div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Bar Chart */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800">Adherence History</h3>
            <div className="flex gap-2">
              {['weekly','monthly'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition
                    ${view === v ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={graphData} barSize={14} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={v => v !== null ? `${v}%` : 'No data'} contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="Meds" fill="#2563eb" radius={[4,4,0,0]} />
              <Bar dataKey="Routine" fill="#93c5fd" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Meds</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300 inline-block" /> Routine</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">Based on saved daily data · {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
        </div>

        {/* Streak Badges + Export */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4">Streak Badges</h3>
            <div className="grid grid-cols-3 gap-2">
              {badges.map(b => (
                <div key={b.title} className="relative"
                  onMouseEnter={() => !b.unlocked && setTooltipBadge(b.title)}
                  onMouseLeave={() => setTooltipBadge(null)}
                  onClick={() => !b.unlocked && setTooltipBadge(tooltipBadge === b.title ? null : b.title)}>
                  <div className={`flex flex-col items-center p-3 rounded-xl border text-center transition
                    ${b.unlocked ? 'bg-blue-50 border-blue-200' : 'bg-slate-100 border-slate-200 grayscale opacity-50 cursor-pointer'}`}>
                    <span className="text-2xl mb-1">{b.icon}</span>
                    <p className={`text-xs font-bold ${b.unlocked ? 'text-slate-700' : 'text-slate-400'}`}>{b.title}</p>
                    <p className={`text-xs ${b.unlocked ? 'text-slate-500' : 'text-slate-400'}`}>{b.sub}</p>
                  </div>
                  {!b.unlocked && tooltipBadge === b.title && (
                    <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg text-center pointer-events-none">
                      🔒 {b.condition}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-2">Export Summary</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Generate a health summary PDF to share with your doctor, including medication adherence and vitals.
            </p>
            <button onClick={handleExportPDF} className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition">
              Export PDF for Doctor
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


// Helper to get today's date string for localStorage keys
const getTodayDateString = () => new Date().toISOString().slice(0, 10);

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ profile, user, onLogout }) {
  const [tab, setTab] = useState(() => {
    const saved = loadFromLocalStorage(`careCompanionTab_${(user?.name || '').toLowerCase()}`)
    return saved || 'home'
  })

  const handleTabChange = (newTab) => {
    setTab(newTab)
    saveToLocalStorage(`careCompanionTab_${(user?.name || '').toLowerCase()}`, newTab)
  }
  const [currentProfile, setCurrentProfile] = useState(profile)

  // Load initial state from localStorage
  const username = (user?.name || currentProfile.name).toLowerCase(); // Use lowercase for consistent storage keys
  const todayDate = getTodayDateString();

  const [checked, setChecked] = useState(() => {
    const savedChecked = loadFromLocalStorage(`careCompanionCheckedTasks_${username}_${todayDate}`);
    return savedChecked || {};
  });
  const [streak, setStreak] = useState(() => computeStreak((user?.name || '').toLowerCase()))
  const [showPopup, setShowPopup] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState(() =>
    loadFromLocalStorage(`careCompanionNotifs_${(user?.name || '').toLowerCase()}`) || []
  )
  const [medAlert, setMedAlert] = useState(null)
  const snoozeUntilRef = useRef({})

  const addNotification = (notif) => {
    setNotifications(prev => {
      // avoid duplicate unread notifs with same id
      if (prev.find(n => n.id === notif.id && !n.read)) return prev
      const updated = [{ ...notif, read: false, ts: Date.now() }, ...prev].slice(0, 50)
      saveToLocalStorage(`careCompanionNotifs_${username}`, updated)
      return updated
    })
  }

  const markRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n)
      saveToLocalStorage(`careCompanionNotifs_${username}`, updated)
      return updated
    })
  }

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      saveToLocalStorage(`careCompanionNotifs_${username}`, updated)
      return updated
    })
  }

  const clearNotifications = () => {
    saveToLocalStorage(`careCompanionNotifs_${username}`, [])
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const [popupShownToday, setPopupShownToday] = useState(() => {
    const savedPopupShown = loadFromLocalStorage(`careCompanionPopupShown_${username}_${todayDate}`);
    return savedPopupShown || false;
  });

  useEffect(() => {
    setCurrentProfile(profile)
  }, [profile])

  // Save states to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage(`careCompanionCheckedTasks_${username}_${todayDate}`, checked);
    // Save daily history for graphs
    const deletedRoutines = currentProfile.deletedRoutines || []
    const condTasks = (CONDITION_TASKS[currentProfile.condition] || []).filter(t => !deletedRoutines.includes(t.id))
    const totalMeds = currentProfile.meds.length
    const doneMeds = currentProfile.meds.filter(m => checked[`med_${m.name}`]).length
    const doneRoutine = condTasks.filter(t => checked[t.id]).length
    const total = totalMeds + condTasks.length
    const done = Object.values(checked).filter(Boolean).length
    const existing = loadFromLocalStorage(`careCompanionHistory_${username}_${todayDate}`) || {}
    saveToLocalStorage(`careCompanionHistory_${username}_${todayDate}`, {
      ...existing,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
      medPct: totalMeds > 0 ? Math.round((doneMeds / totalMeds) * 100) : 0,
      routinePct: condTasks.length > 0 ? Math.round((doneRoutine / condTasks.length) * 100) : 0,
      missedMeds: getMissedMeds(currentProfile.meds).length > 0,
    })
    // Recompute streak from history
    setStreak(computeStreak(username))
  }, [checked, username, todayDate]);


  useEffect(() => {
    saveToLocalStorage(`careCompanionPopupShown_${username}_${todayDate}`, popupShownToday);
  }, [popupShownToday, username, todayDate]);

  // Push notifications for missed meds and upcoming dose
  useEffect(() => {
    missedMeds.forEach(m => {
      addNotification({
        id: `missed_${m.name}_${todayDate}`,
        type: 'missed',
        title: 'Missed Dose',
        body: `${m.name} was due at ${fmtTime(m.time)}`,
      })
    })
  }, [missedMeds.length])

  useEffect(() => {
    if (upcoming) {
      addNotification({
        id: `upcoming_${upcoming.name}_${upcoming.time}_${todayDate}`,
        type: 'upcoming',
        title: 'Upcoming Dose',
        body: `${upcoming.name} in ${upcoming.diffMin} mins at ${fmtTime(upcoming.time)}`,
      })
    }
  }, [upcoming?.name, upcoming?.diffMin])

  // Med alert interval — checks every 30s if a med is due and not yet done/snoozed
  useEffect(() => {
    const check = () => {
      if (medAlert) return // already showing one
      const now = new Date()
      const todayDay = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()]
      for (const med of currentProfile.meds) {
        if (!med.time || !med.days.includes(todayDay)) continue
        if (!isMedActive(med, todayDate)) continue
        const taskId = `med_${med.name}`
        if (checked[taskId]) continue // already done
        const [h, m] = med.time.split(':').map(Number)
        const due = new Date(); due.setHours(h, m, 0, 0)
        const diffMs = now - due
        if (diffMs < 0) continue // not yet due
        const snoozeUntil = snoozeUntilRef.current[taskId] || 0
        if (Date.now() < snoozeUntil) continue // snoozed
        // Due and not snoozed — show alert
        setMedAlert({ med, taskId })
        addNotification({
          id: `alert_${med.name}_${med.time}_${todayDate}`,
          type: 'alert',
          title: 'Medication Due',
          body: `Time to take ${med.name} (${fmtTime(med.time)})`,
        })
        return
      }
    }
    check() // run immediately on mount / profile change
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [currentProfile.meds, checked, medAlert])

  const handleMedAlertDone = () => {
    if (!medAlert) return
    setChecked(prev => ({ ...prev, [medAlert.taskId]: true }))
    setMedAlert(null)
  }

  const handleMedAlertSnooze = () => {
    if (!medAlert) return
    snoozeUntilRef.current[medAlert.taskId] = Date.now() + 5 * 60 * 1000
    setMedAlert(null)
  }

  const handleProfileUpdate = (updatedData) => {
    const users = loadFromLocalStorage('careCompanionUsers') || {};
    const oldUsernameKey = (user?.name || currentProfile.name).toLowerCase();
    const newDisplayName = updatedData.name.trim();
    const newUsernameKey = newDisplayName.toLowerCase();

    const currentUserData = users[oldUsernameKey] || { name: newDisplayName, password: user?.password || '' };

    const updatedUserData = {
      ...currentUserData,
      name: newDisplayName,
      profile: updatedData,
    };

    if (oldUsernameKey !== newUsernameKey) {
      if (users[newUsernameKey] && oldUsernameKey !== newUsernameKey) {
        // name conflict — still update profile without renaming
        users[oldUsernameKey] = { ...currentUserData, profile: updatedData };
      } else {
        delete users[oldUsernameKey];
        users[newUsernameKey] = updatedUserData;
      }
    } else {
      users[oldUsernameKey] = updatedUserData;
    }
    saveToLocalStorage('careCompanionUsers', users);
    saveToLocalStorage('careCompanionSession', { loggedUser: user, profile: updatedData });
    setCurrentProfile(updatedData);
    handleTabChange('home');
  }

  const handleMedsUpdate = (updatedMeds) => {
    const updatedProfile = { ...currentProfile, meds: updatedMeds }
    const users = loadFromLocalStorage('careCompanionUsers') || {}
    const key = (user?.name || currentProfile.name).toLowerCase()
    if (users[key]) {
      users[key] = { ...users[key], profile: updatedProfile }
      saveToLocalStorage('careCompanionUsers', users)
    }
    saveToLocalStorage('careCompanionSession', { loggedUser: user, profile: updatedProfile })
    setCurrentProfile(updatedProfile)
  }

  const handleRoutinesUpdate = (deletedRoutines) => {
    const updatedProfile = { ...currentProfile, deletedRoutines }
    const users = loadFromLocalStorage('careCompanionUsers') || {}
    const key = (user?.name || currentProfile.name).toLowerCase()
    if (users[key]) {
      users[key] = { ...users[key], profile: updatedProfile }
      saveToLocalStorage('careCompanionUsers', users)
    }
    saveToLocalStorage('careCompanionSession', { loggedUser: user, profile: updatedProfile })
    setCurrentProfile(updatedProfile)
  }

  const condTasks = CONDITION_TASKS[currentProfile.condition] || []
  const medTasks = currentProfile.meds.filter(m => isMedActive(m, todayDate)).map(m => ({ id: `med_${m.name}` }))
  const allTasks = [...condTasks, ...medTasks]
  const done = Object.values(checked).filter(Boolean).length
  const allDone = done === allTasks.length && allTasks.length > 0
  
  useEffect(() => {
    if (allDone && !popupShownToday) { setShowPopup(true); setPopupShownToday(true); }
  }, [allDone, popupShownToday]);

  const activeMeds = currentProfile.meds.filter(m => isMedActive(m, todayDate))
  const missedMeds = getMissedMeds(activeMeds)
  const upcoming = getUpcomingMed(activeMeds)

  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }))

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'logs', label: 'Health Logs', icon: Activity },
    { id: 'insights', label: 'Insights', icon: BarChart2 },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-100 shadow-sm p-4 shrink-0 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart className="text-white" size={16} />
          </div>
          <span className="font-bold text-slate-900 text-sm">Care<span className="text-blue-600">Companion</span></span>
        </div>
        <nav className="space-y-1 flex-1">
          {navItems.map(n => <NavItem key={n.id} icon={n.icon} label={n.label} active={tab === n.id} onClick={() => handleTabChange(n.id)} />)}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition text-sm font-medium px-4 py-2 mt-4">
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 shadow-sm px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-bold text-slate-900 capitalize">{tab === 'home' ? 'Dashboard' : tab === 'logs' ? 'Health Logs' : tab.charAt(0).toUpperCase() + tab.slice(1)}</h1>
            <p className="text-xs text-slate-400">{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowNotifications(n => !n)}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition" aria-label="Notifications">
                <Bell size={20} className="text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-84 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden" style={{width:'340px'}}>
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">Notifications</p>
                      {unreadCount > 0 && (
                        <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <>
                          {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition">
                              Mark all read
                            </button>
                          )}
                          <button onClick={clearNotifications} className="text-xs text-slate-400 font-semibold hover:text-red-500 transition">
                            Clear
                          </button>
                        </>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 ml-1">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm">
                        <Bell size={24} className="mx-auto mb-2 opacity-30" />
                        No notifications
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {notifications.map(n => (
                          <div key={n.id}
                            className={`flex items-start gap-3 px-4 py-3 transition cursor-pointer hover:bg-slate-50
                              ${n.read ? 'opacity-60' : n.type === 'missed' ? 'bg-red-50' : n.type === 'alert' ? 'bg-orange-50' : 'bg-blue-50'}`}
                            onClick={() => markRead(n.id)}>
                            <div className="shrink-0 mt-0.5">
                              {n.type === 'missed' && <AlertTriangle className="text-red-500" size={16} />}
                              {n.type === 'upcoming' && <Clock className="text-blue-500" size={16} />}
                              {n.type === 'alert' && <Bell className="text-orange-500" size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${n.type === 'missed' ? 'text-red-700' : n.type === 'alert' ? 'text-orange-700' : 'text-blue-700'}`}>
                                {n.title}
                              </p>
                              <p className={`text-xs mt-0.5 ${n.type === 'missed' ? 'text-red-500' : n.type === 'alert' ? 'text-orange-500' : 'text-blue-500'}`}>
                                {n.body}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(n.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {(user?.name || currentProfile.name).charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:block">{user?.name || currentProfile.name}</span>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 bg-white border-b border-slate-100 px-3 py-2 overflow-x-auto">
          {navItems.map(n => (
            <button key={n.id} onClick={() => handleTabChange(n.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition
                ${tab === n.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              <n.icon size={14} /> {n.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 p-5 overflow-auto">
          {tab === 'home' && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
              <div className="xl:col-span-3">
                <HomeTab profile={currentProfile} checked={checked} onToggle={toggle} streak={streak} missedMeds={missedMeds} upcoming={upcoming} />
              </div>
              <div className="space-y-5">
                {/* Consistency Alert */}
                {missedMeds.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="text-amber-500" size={18} />
                      <span className="font-bold text-amber-800 text-sm">Consistency Alert</span>
                    </div>
                    <p className="text-amber-700 text-xs">⚠️ {missedMeds.length} dose{missedMeds.length > 1 ? 's' : ''} missed today</p>
                    <ul className="mt-2 space-y-1">
                      {missedMeds.map(m => <li key={m.name} className="text-xs text-amber-600">• {m.name} at {fmtTime(m.time)}</li>)}
                    </ul>
                  </div>
                )}
                {/* Streak */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
                  <p className="text-3xl font-black text-blue-600">🔥 {streak}</p>
                  <p className="text-slate-500 text-xs mt-1 font-medium">Day Streak</p>
                </div>
                {/* Calendar */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <MiniCalendar username={username} />
                </div>
              </div>
            </div>
          )}
          {tab === 'schedule' && <ScheduleTab profile={currentProfile} checked={checked} onToggle={toggle} setTab={handleTabChange} onUpdateMeds={handleMedsUpdate} onUpdateRoutines={handleRoutinesUpdate} />}
          {tab === 'logs' && <HealthLogsTab username={username} todayDate={todayDate} />}
          {tab === 'insights' && <InsightsTab profile={currentProfile} checked={checked} streak={streak} username={username} />}
          {tab === 'profile' && <ProfileForm user={currentProfile} onSubmit={handleProfileUpdate} />}
        </main>
      </div>

      {/* Day 1 Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center relative">
            <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" aria-label="Close">
              <X size={20} />
            </button>
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-200">
              <Trophy className="text-yellow-500" size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Day {streak} Complete! 🎉</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Amazing work! You've completed all your tasks and medications for today. Every day counts on your recovery journey.
            </p>
            <button onClick={() => { setShowPopup(false); setPopupShownToday(true); }}
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition text-base">
              Keep Going 🚀
            </button>
          </div>
        </div>
      )}

      {/* Med Alert Popup */}
      {medAlert && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] px-4" role="alertdialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-bounce-once">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-200">
              <Pill className="text-blue-500" size={38} />
            </div>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Medication Reminder</p>
            <h2 className="text-2xl font-black text-slate-900 mb-1">{medAlert.med.name}</h2>
            <p className="text-slate-500 text-sm mb-6">
              It's time to take your medication.<br />
              <span className="font-semibold text-slate-700">{fmtTime(medAlert.med.time)}</span>
            </p>
            <div className="flex gap-3">
              <button onClick={handleMedAlertSnooze}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition text-sm">
                ⏰ Snooze 5 min
              </button>
              <button onClick={handleMedAlertDone}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition text-sm">
                ✓ Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
