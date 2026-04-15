import { useState } from 'react'
import { saveToLocalStorage, loadFromLocalStorage } from './storage'
import { Heart, Eye, EyeOff, UserPlus } from 'lucide-react'

const Field = ({ label, name, type = 'text', value, onChange, error, placeholder, rightEl }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
      />
      {rightEl}
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

export default function SignUp({ onSubmit, onLogin }) {
  const [form, setForm] = useState({ name: '', mobile: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = 'Enter a valid 10-digit mobile number'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const displayName = form.name.trim();
    const storageKey = displayName.toLowerCase();
    // Save user to local storage
    const users = loadFromLocalStorage('careCompanionUsers') || {}
    if (users[storageKey]) {
      setErrors({ name: 'Account with this name already exists.' })
      return
    }
    const newUser = {
      name: displayName,
      mobile: form.mobile,
      password: form.password,
      profile: { name: displayName, age: '', condition: '', meds: [] } // Initial empty profile
    }
    saveToLocalStorage('careCompanionUsers', { ...users, [storageKey]: newUser })
    onSubmit(newUser) // Still call original onSubmit, passing the new user object
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Your Account</h1>
          <p className="text-slate-500 text-sm mt-1">Join CareCompanion and take control of your health</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field 
            label="Full Name" name="name" placeholder="e.g. Ramesh Kumar"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Field 
            label="Mobile Number" name="mobile" type="tel" placeholder="e.g. 9876543210"
            value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })}
            error={errors.mobile}
          />
          <Field
            label="Create Password" name="password"
            type={showPwd ? 'text' : 'password'} placeholder="Min. 6 characters"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            rightEl={
              <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <Field
            label="Confirm Password" name="confirm"
            type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
            value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
            error={errors.confirm}
            rightEl={
              <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <button type="submit" className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md text-base mt-2">
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <button onClick={onLogin} className="text-blue-600 font-semibold hover:underline">Sign In</button>
        </p>
      </div>
    </div>
  )
}
