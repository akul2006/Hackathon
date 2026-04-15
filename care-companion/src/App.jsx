import { useState } from 'react'
import Homepage from './pages/Homepage'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import ProfileForm from './pages/ProfileForm'
import Dashboard from './pages/Dashboard'
import { loadFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from './pages/storage'

export default function App() {
  const [screen, setScreen] = useState(() => {
    const session = loadFromLocalStorage('careCompanionSession')
    if (session?.loggedUser && session?.profile) return 'dashboard'
    return 'home'
  })
  const [profile, setProfile] = useState(() => {
    const session = loadFromLocalStorage('careCompanionSession')
    return session?.profile || null
  })
  const [loggedUser, setLoggedUser] = useState(() => {
    const session = loadFromLocalStorage('careCompanionSession')
    return session?.loggedUser || null
  })

  const handleSignUp = () => {
    setScreen('login')
  }

  const handleLogin = (user) => {
    const profile = user.profile?.condition ? user.profile : null
    setLoggedUser(user)
    setProfile(profile)
    if (profile) {
      saveToLocalStorage('careCompanionSession', { loggedUser: user, profile })
      setScreen('dashboard')
    } else {
      setScreen('profile')
    }
  }

  const handleProfileSubmit = (data) => {
    setProfile(data)
    saveToLocalStorage('careCompanionSession', { loggedUser, profile: data })
    setScreen('dashboard')
  }

  const handleLogout = () => {
    setLoggedUser(null)
    setProfile(null)
    removeFromLocalStorage('careCompanionSession')
    setScreen('home')
  }

  return (
    <div className="font-sans">
      {screen === 'home' && <Homepage onCreateAccount={() => setScreen('signup')} onLogin={() => setScreen('login')} />}
      {screen === 'signup' && <SignUp onSubmit={handleSignUp} onLogin={() => setScreen('login')} />}
      {screen === 'login' && <Login onSubmit={handleLogin} onSignup={() => setScreen('signup')} />}
      {screen === 'profile' && <ProfileForm user={loggedUser} onSubmit={handleProfileSubmit} />}
      {screen === 'dashboard' && <Dashboard profile={profile} user={loggedUser} onLogout={handleLogout} />}
    </div>
  )
}
