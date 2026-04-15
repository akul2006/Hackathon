import { Heart, Bell, BarChart2, ShieldCheck, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react'

const features = [
  { icon: Bell, title: 'Smart Reminders', desc: 'Timely alerts for every medication based on your personal schedule.' },
  { icon: BarChart2, title: 'Progress Tracking', desc: 'Visualise daily, weekly, and monthly health completion rates.' },
  { icon: ShieldCheck, title: 'Recovery Focus', desc: 'Condition-specific routines for Diabetes, Heart Blockage, Arthritis & more.' },
  { icon: Clock, title: 'Consistency Alerts', desc: 'Instant warnings when doses or tasks are overdue by 2+ hours.' },
  { icon: Users, title: 'Elderly Friendly', desc: 'Large fonts, high-contrast UI, and simple navigation for all ages.' },
  { icon: Heart, title: 'Streak Tracking', desc: 'Calendar-based streaks to keep you motivated every single day.' },
]

const stats = [
  { value: '10,000+', label: 'Active Patients' },
  { value: '98%', label: 'Dose Adherence' },
  { value: '5 Conditions', label: 'Supported' },
  { value: '24/7', label: 'Monitoring' },
]

export default function Homepage({ onCreateAccount, onLogin }) {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold text-slate-900">Care<span className="text-blue-600">Companion</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#conditions" className="hover:text-blue-600 transition">Conditions</a>
            <a href="#about" className="hover:text-blue-600 transition">About</a>
          </div>
          <div className="flex gap-3">
            <button onClick={onLogin} className="px-5 py-2 text-blue-600 border border-blue-200 rounded-lg font-semibold hover:bg-blue-50 transition text-sm">
              Login
            </button>
            <button onClick={onCreateAccount} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm shadow-sm">
              Create Account
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize:'60px 60px'}} />
        <div className="max-w-4xl mx-auto text-center relative">
          <span className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/30">
            🏥 Trusted by 10,000+ Patients
          </span>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Your Personal<br /><span className="text-blue-200">Health Companion</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            CareCompanion helps chronic condition patients stay on top of medications, daily routines, and recovery goals — all in one clean, accessible dashboard.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button onClick={onCreateAccount} className="flex items-center gap-2 px-8 py-4 bg-white text-blue-700 text-base font-bold rounded-xl hover:bg-blue-50 transition shadow-lg">
              Get Started Free <ArrowRight size={18} />
            </button>
            <button onClick={onLogin} className="px-8 py-4 border-2 border-white/40 text-white text-base font-semibold rounded-xl hover:bg-white/10 transition">
              Sign In to Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-blue-400">{s.value}</p>
              <p className="text-slate-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything You Need to Stay Well</h2>
            <p className="text-slate-500 text-lg">Built for patients managing chronic conditions, designed for daily use.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-7 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition bg-white group">
                <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mb-5 transition">
                  <Icon className="text-blue-600" size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-14">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Profile', desc: 'Enter your condition, medications, and daily schedule in minutes.' },
              { step: '02', title: 'Get Personalised Tasks', desc: 'Receive condition-specific routines and medication reminders.' },
              { step: '03', title: 'Track Your Progress', desc: 'Monitor streaks, completion rates, and consistency over time.' },
            ].map(s => (
              <div key={s.step} className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100">
                <div className="text-4xl font-black text-blue-100 mb-3">{s.step}</div>
                <h3 className="font-bold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section id="conditions" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Tailored for Your Condition</h2>
          <p className="text-slate-500 text-lg mb-10">Condition-specific routines and reminders built into your dashboard.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Diabetes', emoji: '🩸' },
              { name: 'High Blood Pressure', emoji: '❤️' },
              { name: 'Arthritis', emoji: '🦴' },
              { name: 'Heart Blockage', emoji: '💓' },
              { name: 'Hemorrhoids', emoji: '🏥' },
            ].map(c => (
              <div key={c.name} className="flex items-center gap-2 px-6 py-3 bg-blue-50 border border-blue-100 text-blue-800 font-semibold rounded-full text-sm shadow-sm">
                <span>{c.emoji}</span> {c.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-5">Built for Real Patients</h2>
            <p className="text-slate-600 leading-relaxed mb-5">
              CareCompanion was designed with elderly patients and chronic condition sufferers in mind. We believe managing your health should be simple, not stressful.
            </p>
            <ul className="space-y-3">
              {['No complex setup — get started in 2 minutes', 'Large, readable fonts for all ages', 'Works without internet after setup', 'No data sold — your health is private'].map(item => (
                <li key={item} className="flex items-center gap-3 text-slate-700 text-sm">
                  <CheckCircle className="text-green-500 shrink-0" size={18} /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-blue-600 rounded-2xl p-8 text-white text-center shadow-xl">
            <Heart size={48} className="mx-auto mb-4 text-blue-200" />
            <h3 className="text-2xl font-bold mb-3">Start Your Recovery Journey</h3>
            <p className="text-blue-100 mb-6 text-sm leading-relaxed">Join thousands of patients who use CareCompanion to stay consistent, healthy, and in control.</p>
            <button onClick={onCreateAccount} className="w-full py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition">
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-slate-900 text-slate-400 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="text-blue-400" size={16} />
          <span className="text-white font-bold">CareCompanion</span>
        </div>
        <p>© 2025 CareCompanion. Designed for patient wellness.</p>
      </footer>
    </div>
  )
}
