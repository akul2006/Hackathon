import { useState } from 'react'
import Homepage from './pages/Homepage'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import ProfileForm from './pages/ProfileForm'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [users, setUsers] = useState([]) // mock user store
  const [profile, setProfile] = useState(null)
  const [loggedUser, setLoggedUser] = useState(null)

  const handleSignUp = (userData) => {
    setUsers(prev => [...prev, userData])
    setScreen('login')
  }

  const handleLogin = (creds) => {
    const found = users.find(u => u.name === creds.name && u.password === creds.password)
    if (found) {
      setLoggedUser(found)
      setScreen('profile')
      return true
    }
    return false
  }

  const handleProfileSubmit = (data) => {
    setProfile(data)
    setScreen('dashboard')
  }

  const handleLogout = () => {
    setLoggedUser(null)
    setProfile(null)
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
