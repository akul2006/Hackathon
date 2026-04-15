import { useState, useEffect } from 'react'
import { Heart, Bell, Home, Calendar, BarChart2, Activity, User, LogOut,
  CheckCircle2, Circle, AlertTriangle, Trophy, X, Clock, Pill,
  TrendingUp, Droplets, Wind, Footprints, Clipboard, ThermometerSun, ShieldCheck } from 'lucide-react'
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

// ── sub-components ────────────────────────────────────────────────────────────
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

function MiniCalendar({ streak }) {
  const today = new Date()
  const year = today.getFullYear(), month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const todayDate = today.getDate()
  const streakDays = Array.from({ length: streak }, (_, i) => todayDate - i).filter(d => d > 0)
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
            ${d && d !== todayDate && streakDays.includes(d) ? 'bg-green-100 text-green-700' : ''}
            ${d && d !== todayDate && !streakDays.includes(d) ? 'text-slate-500' : ''}
          `}>{d || ''}</div>
        ))}
      </div>
    </div>
  )
}

// ── Home Tab ──────────────────────────────────────────────────────────────────
function HomeTab({ profile, checked, onToggle, streak, missedMeds, upcoming }) {
  const condTasks = CONDITION_TASKS[profile.condition] || []
  const medTasks = profile.meds.map(m => ({ id: `med_${m.name}`, label: `Take ${m.name}`, time: m.time, type: 'med' }))
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

// ── Schedule Tab ──────────────────────────────────────────────────────────────
function ScheduleTab({ profile, checked, onToggle, setTab }) {
  const today = new Date()
  const todayIdx = today.getDay() // 0=Sun
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - todayIdx + i)
    return { label: DAYS_SHORT[i], date: d.getDate(), isToday: i === todayIdx }
  })

  const condTasks = CONDITION_TASKS[profile.condition] || []
  const medTasks = profile.meds.map(m => ({ id: `med_${m.name}`, label: `Take ${m.name}`, time: m.time, type: 'med' }))
  const allTasks = [...medTasks, ...condTasks]

  return (
    <div className="space-y-5">
      {/* Week strip */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex gap-2 justify-between">
          {weekDays.map((d, i) => (
            <div key={i} className={`flex flex-col items-center px-3 py-2 rounded-xl text-sm font-semibold transition
              ${d.isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              <span className="text-xs">{d.label}</span>
              <span className="text-base font-bold">{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today's schedule */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4">Today's Schedule</h3>
          <div className="space-y-3">
            {allTasks.map(task => {
              const isDone = !!checked[task.id]
              return (
                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border transition
                  ${isDone ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs text-slate-400 w-16 shrink-0 pt-0.5">{task.time ? fmtTime(task.time) : '—'}</div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.label}</p>
                    {task.type === 'med' && <p className="text-xs text-slate-400 mt-0.5">Dosage · Before Meal · Status: <span className={isDone ? 'text-green-600' : 'text-amber-600'}>{isDone ? 'DONE' : 'PENDING'}</span></p>}
                  </div>
                  <button onClick={() => onToggle(task.id)}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg border transition
                      ${isDone ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
                    {isDone ? 'Done ✓' : 'Mark Done'}
                  </button>
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
                  <p className="text-xs text-slate-400">{fmtTime(m.time)} · {m.days.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setTab('profile')} className="mt-4 w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">
            + Add Medication / Routine
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Health Logs Tab ───────────────────────────────────────────────────────────
function HealthLogsTab() {
  const [vitals, setVitals] = useState({ sugar: '', heartRate: '', weight: '' })
  const [mood, setMood] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  const moods = [
    { label: 'Happy', emoji: '😊' }, { label: 'Tired', emoji: '😴' },
    { label: 'Pain', emoji: '😣' }, { label: 'Dizzy', emoji: '😵' },
  ]

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
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
                <div className="relative flex-1">
                  <input type="number" value={vitals[key]}
                    onChange={e => setVitals({ ...vitals, [key]: e.target.value })}
                    placeholder="—"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
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
  )
}

// ── Insights Tab ─────────────────────────────────────────────────────────────
function InsightsTab({ profile, checked }) {
  const [view, setView] = useState('weekly')
  const condTasks = CONDITION_TASKS[profile.condition] || []
  const medTasks = profile.meds.map(m => ({ id: `med_${m.name}` }))
  const allTasks = [...condTasks, ...medTasks]
  const done = Object.values(checked).filter(Boolean).length
  const total = allTasks.length
  const todayPct = total > 0 ? Math.round((done / total) * 100) : 0

  const weeklyData = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => {
    const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
    return {
      day: d,
      Meds: isToday ? Math.min(todayPct, 100) : Math.floor(55 + Math.random() * 45),
      Routine: isToday ? Math.min(todayPct, 100) : Math.floor(50 + Math.random() * 50),
    }
  })

  const monthlyData = ['Wk 1','Wk 2','Wk 3','Wk 4'].map((w, i) => ({
    week: w,
    Meds: i < 3 ? Math.floor(60 + Math.random() * 40) : todayPct,
    Routine: i < 3 ? Math.floor(55 + Math.random() * 45) : todayPct,
  }))

  const graphData = view === 'weekly' ? weeklyData : monthlyData
  const xKey = view === 'weekly' ? 'day' : 'week'

  const badges = [
    { icon: '🏅', title: '7 Days', sub: '100% Meds', color: 'bg-blue-50 border-blue-200' },
    { icon: '⏰', title: 'Punctual', sub: 'Pete', color: 'bg-green-50 border-green-200' },
    { icon: '📋', title: 'Log', sub: 'Master', color: 'bg-purple-50 border-purple-200' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Bar Chart */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800">Adherence (Last 7 Days)</h3>
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
              <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="Meds" fill="#2563eb" radius={[4,4,0,0]} />
              <Bar dataKey="Routine" fill="#93c5fd" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Meds</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300 inline-block" /> Routine</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">Historical data · {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
        </div>

        {/* Streak Badges + Export */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4">Streak Badges</h3>
            <div className="grid grid-cols-3 gap-2">
              {badges.map(b => (
                <div key={b.title} className={`flex flex-col items-center p-3 rounded-xl border text-center ${b.color}`}>
                  <span className="text-2xl mb-1">{b.icon}</span>
                  <p className="text-xs font-bold text-slate-700">{b.title}</p>
                  <p className="text-xs text-slate-500">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-2">Export Summary</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Generate a health summary report to share with your doctor, including medication adherence and vitals.
            </p>
            <button className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition">
              Generate PDF / JSON for Doctor
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
  const [tab, setTab] = useState('home')
  const [currentProfile, setCurrentProfile] = useState(profile)

  // Load initial state from localStorage
  const username = (user?.name || currentProfile.name).toLowerCase(); // Use lowercase for consistent storage keys
  const todayDate = getTodayDateString();

  const [checked, setChecked] = useState(() => {
    const savedChecked = loadFromLocalStorage(`careCompanionCheckedTasks_${username}_${todayDate}`);
    return savedChecked || {};
  });
  const [streak, setStreak] = useState(() => {
    const savedStreak = loadFromLocalStorage(`careCompanionStreak_${username}`);
    return savedStreak !== undefined ? savedStreak : 1;
  });
  const [showPopup, setShowPopup] = useState(false)
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
  }, [checked, username, todayDate]);

  useEffect(() => {
    saveToLocalStorage(`careCompanionStreak_${username}`, streak);
  }, [streak, username]);

  useEffect(() => {
    saveToLocalStorage(`careCompanionPopupShown_${username}_${todayDate}`, popupShownToday);
  }, [popupShownToday, username, todayDate]);

  const handleProfileUpdate = (updatedData) => {
    const users = loadFromLocalStorage('careCompanionUsers') || {};
    const oldUsernameKey = (user?.name || currentProfile.name).toLowerCase();
    const newDisplayName = updatedData.name.trim();
    const newUsernameKey = newDisplayName.toLowerCase();

    const currentUserData = users[oldUsernameKey];

    if (currentUserData) {
      const updatedUserData = {
        ...currentUserData,
        name: newDisplayName,
        profile: updatedData,
      };

      if (oldUsernameKey !== newUsernameKey) {
        if (users[newUsernameKey]) {
          console.error('A user with this name already exists.');
          return;
        }
        delete users[oldUsernameKey];
        users[newUsernameKey] = updatedUserData;
      } else {
        users[oldUsernameKey] = updatedUserData;
      }
      saveToLocalStorage('careCompanionUsers', users);
    }
    setCurrentProfile(updatedData);
    setTab('home');
  }

  const condTasks = CONDITION_TASKS[currentProfile.condition] || []
  const medTasks = currentProfile.meds.map(m => ({ id: `med_${m.name}` }))
  const allTasks = [...condTasks, ...medTasks]
  const done = Object.values(checked).filter(Boolean).length
  const allDone = done === allTasks.length && allTasks.length > 0
  
  useEffect(() => {
    if (allDone && !popupShownToday) { setShowPopup(true); setPopupShownToday(true); }
  }, [allDone, popupShownToday]);

  const missedMeds = getMissedMeds(currentProfile.meds)
  const upcoming = getUpcomingMed(currentProfile.meds)

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
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-100 shadow-sm p-4 shrink-0">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart className="text-white" size={16} />
          </div>
          <span className="font-bold text-slate-900 text-sm">Care<span className="text-blue-600">Companion</span></span>
        </div>
        <nav className="space-y-1 flex-1">
          {navItems.map(n => <NavItem key={n.id} icon={n.icon} label={n.label} active={tab === n.id} onClick={() => setTab(n.id)} />)}
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
            <button className="relative p-2 rounded-xl hover:bg-slate-100 transition" aria-label="Notifications">
              <Bell size={20} className="text-slate-500" />
              {missedMeds.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
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
            <button key={n.id} onClick={() => setTab(n.id)}
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
                  <MiniCalendar streak={streak} />
                </div>
              </div>
            </div>
          )}
          {tab === 'schedule' && <ScheduleTab profile={currentProfile} checked={checked} onToggle={toggle} setTab={setTab} />}
          {tab === 'logs' && <HealthLogsTab />}
          {tab === 'insights' && <InsightsTab profile={currentProfile} checked={checked} />}
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
            <button onClick={() => { setShowPopup(false); setStreak(s => s + 1); setPopupShownToday(true); }}
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition text-base">
              Keep Going 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
