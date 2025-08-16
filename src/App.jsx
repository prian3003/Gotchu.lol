import React, { useState, useEffect } from 'react'
import {Route,BrowserRouter as Router,Routes, useLocation} from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Navbar from './components/layout/Navbar'
import Home from './components/layout/Home'
import SignIn from './components/auth/SignIn'
import SignUp from './components/auth/SignUp'
import EmailVerification from './components/auth/EmailVerification'
import VerifyEmail from './components/auth/VerifyEmail'
import Dashboard from './components/pages/Dashboard'
import UserProfile from './components/pages/UserProfile'
import Loader from './components/ui/Loader'

const NavbarWrapper = () => {
  const location = useLocation()
  const hideNavbarRoutes = ['/signin', '/signup', '/email-verification', '/verify-email', '/dashboard']
  
  // Also hide navbar for username profile pages
  const isProfilePage = /^\/[a-zA-Z0-9_]+$/.test(location.pathname)
  
  if (hideNavbarRoutes.includes(location.pathname) || isProfilePage) {
    return null
  }
  
  return <Navbar />
}

const App = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000) // 2 seconds loading time

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <ThemeProvider>
        <main>
          <Loader />
        </main>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <main>
        <Router>
          <NavbarWrapper/>
          <Routes>
            <Route path='/' element={<Home />}/>
            <Route path='/signin' element={<SignIn />}/>
            <Route path='/signup' element={<SignUp />}/>
            <Route path='/email-verification' element={<EmailVerification />}/>
            <Route path='/verify-email' element={<VerifyEmail />}/>
            <Route path='/dashboard' element={<Dashboard />}/>
            <Route path='/about' element={"About"}/>
            <Route path='/project' element={"Project"}/>
            <Route path='/contact' element={"Contact"}/>
            <Route path='/:username' element={<UserProfile />}/>
          </Routes>
        </Router>
      </main>
    </ThemeProvider>
  )
}

export default App