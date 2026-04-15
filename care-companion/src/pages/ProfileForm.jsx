import { useState } from 'react'
import { Plus, Trash2, ClipboardList } from 'lucide-react'

const CONDITIONS = ['Diabetes', 'High BP', 'Arthritis', 'Heart Blockage', 'Hemorrhoids']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const emptyMed = () => ({ name: '', days: [], times: [''] })

export default function ProfileForm({ user, onSubmit }) {
  const [form, setForm] = useState(() => {
    const initialMeds = user?.meds?.length
      ? user.meds.map(m => ({
          ...m,
          times: m.times || (m.time ? [m.time] : ['']),
        }))
      : [emptyMed()]
    return { name: user?.name || '', age: user?.age || '', condition: user?.condition || '', meds: initialMeds }
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.age || form.age < 1 || form.age > 120) e.age = 'Enter a valid age'
    if (!form.condition) e.condition = 'Please select a condition'
    form.meds.forEach((m, i) => {
      if (!m.name.trim()) e[`mn${i}`] = 'Medicine name required'
      if (!m.days.length) e[`md${i}`] = 'Select at least one day'
      if (m.times.some(t => !t)) e[`mt${i}`] = 'All time fields are required'
    })
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    // The dashboard components currently expect a single `time` property on each medication.
    // The multi-time feature is not fully integrated. To prevent crashes, we'll map
    // the first time from the `times` array to the `time` property, while preserving
    // the `times` array for future use.
    const dataToSubmit = {
      ...form,
      meds: form.meds.map(med => ({
        ...med,
        time: med.times?.[0] || '',
      }))
    };
    onSubmit(dataToSubmit);
  }

  const updateMed = (i, field, val) => {
    const meds = [...form.meds]
    meds[i] = { ...meds[i], [field]: val }
    setForm({ ...form, meds })
  }

  const toggleDay = (i, day) => {
    const meds = [...form.meds]
    const days = meds[i].days.includes(day) ? meds[i].days.filter(d => d !== day) : [...meds[i].days, day]
    meds[i] = { ...meds[i], days }
    setForm({ ...form, meds })
  }

  const updateMedTime = (medIndex, timeIndex, value) => {
    const meds = [...form.meds]
    meds[medIndex].times[timeIndex] = value
    setForm({ ...form, meds })
  }
  const addMedTime = (medIndex) => {
    const meds = [...form.meds]
    meds[medIndex].times.push('')
    setForm({ ...form, meds })
  }
  const removeMedTime = (medIndex, timeIndex) => {
    const meds = [...form.meds]
    meds[medIndex].times.splice(timeIndex, 1)
    setForm({ ...form, meds })
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <ClipboardList className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Health Profile</h1>
            <p className="text-slate-500 text-xs">Complete your profile to personalise your dashboard</p>
          </div>
        </div>

        <div className="h-px bg-slate-100 my-6" />

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400' : 'border-slate-200'}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            {/* Age */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Age</label>
              <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })}
                placeholder="e.g. 65" min={1} max={120}
                className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.age ? 'border-red-400' : 'border-slate-200'}`} />
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Medical Condition</label>
            <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}
              className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.condition ? 'border-red-400' : 'border-slate-200'}`}>
              <option value="">Select your condition</option>
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.condition && <p className="text-red-500 text-xs mt-1">{errors.condition}</p>}
          </div>

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Medicine Schedule</h2>
              <span className="text-xs text-slate-400">{form.meds.length} medicine(s)</span>
            </div>
            <div className="space-y-4">
              {form.meds.map((med, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-200 relative">
                  {form.meds.length > 1 && (
                    <button type="button" onClick={() => setForm({ ...form, meds: form.meds.filter((_, idx) => idx !== i) })}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition" aria-label="Remove">
                      <Trash2 size={16} />
                    </button>
                  )}
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">Medicine {i + 1}</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Medicine Name</label>
                      <input type="text" value={med.name} onChange={e => updateMed(i, 'name', e.target.value)}
                        placeholder="e.g. Metformin 500mg"
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors[`mn${i}`] ? 'border-red-400' : 'border-slate-200'}`} />
                      {errors[`mn${i}`] && <p className="text-red-500 text-xs mt-1">{errors[`mn${i}`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">Days of Week</label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS.map(day => (
                          <button key={day} type="button" onClick={() => toggleDay(i, day)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${med.days.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>
                            {day}
                          </button>
                        ))}
                      </div>
                      {errors[`md${i}`] && <p className="text-red-500 text-xs mt-1">{errors[`md${i}`]}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Time(s)</label>
                      {med.times.map((time, timeIndex) => (
                        <div key={timeIndex} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={time}
                            onChange={e => updateMedTime(i, timeIndex, e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors[`mt${i}`] ? 'border-red-400' : 'border-slate-200'}`}
                          />
                          {med.times.length > 1 && (
                            <button type="button" onClick={() => removeMedTime(i, timeIndex)} className="text-slate-400 hover:text-red-500 transition p-1 rounded-full">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addMedTime(i)} className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-800 transition pt-1">
                        <Plus size={14} /> Add Time
                      </button>
                      {errors[`mt${i}`] && <p className="text-red-500 text-xs mt-1">{errors[`mt${i}`]}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setForm({ ...form, meds: [...form.meds, emptyMed()] })}
              className="mt-3 flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition text-sm">
              <Plus size={16} /> Add Another Medicine
            </button>
          </div>

          <button type="submit" className="w-full py-4 bg-blue-600 text-white text-base font-bold rounded-xl hover:bg-blue-700 transition shadow-md">
            Go to My Dashboard →
          </button>
        </form>
      </div>
    </div>
  )
}
