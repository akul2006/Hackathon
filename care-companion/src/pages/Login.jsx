import { useState } from 'react'
import { Heart, Eye, EyeOff, LogIn } from 'lucide-react'
import { loadFromLocalStorage } from './storage'

export default function Login({ onSubmit, onSignup }) {
  const [form, setForm] = useState({ name: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.password) {
      setError('Please enter your name and password.');
      return;
    }

    const users = loadFromLocalStorage('careCompanionUsers') || {};
    const storageKey = form.name.trim().toLowerCase();
    const user = users[storageKey];

    if (user && user.password === form.password) {
      onSubmit(user); // Pass the full user object
    } else {
      setError('Invalid name or password. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your CareCompanion dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm({ ...form, name: e.target.value }); setError('') }}
              placeholder="Enter your registered name"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => { setForm({ ...form, password: e.target.value }); setError('') }}
                placeholder="Enter your password"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md text-base">
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <button onClick={onSignup} className="text-blue-600 font-semibold hover:underline">Create Account</button>
        </p>
      </div>
    </div>
  )
}
