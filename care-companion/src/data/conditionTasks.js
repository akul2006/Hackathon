export const CONDITION_TASKS = {
  Diabetes: [
    { id: 'sugar_am', label: 'Check Blood Sugar (Morning)', type: 'routine' },
    { id: 'walk_30', label: '30-min Walk', type: 'routine' },
    { id: 'sugar_pm', label: 'Check Blood Sugar (Evening)', type: 'routine' },
    { id: 'low_carb', label: 'Log Low-Carb Meal', type: 'routine' },
    { id: 'water', label: 'Drink 8 Glasses of Water', type: 'routine' },
  ],
  'High BP': [
    { id: 'bp_am', label: 'Measure Blood Pressure (Morning)', type: 'routine' },
    { id: 'salt', label: 'Avoid High-Salt Foods', type: 'routine' },
    { id: 'walk_20', label: '20-min Brisk Walk', type: 'routine' },
    { id: 'bp_pm', label: 'Measure Blood Pressure (Evening)', type: 'routine' },
    { id: 'breathe', label: '10-min Deep Breathing', type: 'routine' },
  ],
  Arthritis: [
    { id: 'stretch', label: 'Morning Joint Stretches (10 min)', type: 'routine' },
    { id: 'compress', label: 'Apply Warm Compress to Joints', type: 'routine' },
    { id: 'yoga', label: 'Low-Impact Exercise (Yoga)', type: 'routine' },
    { id: 'pain_log', label: 'Log Pain Level (1–10)', type: 'routine' },
    { id: 'water', label: 'Drink 8 Glasses of Water', type: 'routine' },
  ],
  'Heart Blockage': [
    { id: 'bp_check', label: 'Check Blood Pressure', type: 'routine' },
    { id: 'walk_15', label: '15-min Gentle Walk', type: 'routine' },
    { id: 'no_smoke', label: 'No Smoking / Alcohol Today', type: 'routine' },
    { id: 'low_fat', label: 'Log Low-Fat Meal', type: 'routine' },
    { id: 'weight', label: 'Record Body Weight', type: 'routine' },
  ],
  Hemorrhoids: [
    { id: 'fiber', label: 'Eat High-Fiber Meal', type: 'routine' },
    { id: 'water', label: 'Drink 8 Glasses of Water', type: 'routine' },
    { id: 'sitz', label: 'Sitz Bath (15 min)', type: 'routine' },
    { id: 'no_strain', label: 'Avoid Heavy Lifting', type: 'routine' },
    { id: 'walk_10', label: '10-min Light Walk', type: 'routine' },
  ],
}

export function getMissedMeds(meds) {
  const now = new Date()
  const todayDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()]
  return meds.filter(med => {
    if (!med.days.includes(todayDay)) return false
    const [h, m] = med.time.split(':').map(Number)
    const medTime = new Date(); medTime.setHours(h, m, 0, 0)
    return (now - medTime) / 3600000 > 2
  })
}

export function getUpcomingMed(meds) {
  const now = new Date()
  const todayDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()]
  const upcoming = meds
    .filter(med => med.days.includes(todayDay))
    .map(med => {
      const [h, m] = med.time.split(':').map(Number)
      const t = new Date(); t.setHours(h, m, 0, 0)
      return { ...med, dateObj: t, diffMin: Math.round((t - now) / 60000) }
    })
    .filter(m => m.diffMin > 0)
    .sort((a, b) => a.diffMin - b.diffMin)
  return upcoming[0] || null
}
