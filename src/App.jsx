import React, { useState, useEffect } from 'react'
import {Route,BrowserRouter as Router,Routes, useLocation} from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import QueryProvider from './providers/QueryProvider'
import ErrorProvider, { NetworkStatus } from './providers/ErrorProvider'
import PerformanceProvider from './providers/PerformanceProvider'
import { RouteErrorBoundary } from './components/error/ErrorBoundary'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'
import { createLazyRoute } from './utils/lazyLoad.jsx'
import { PerformanceToggle } from './components/debug/PerformanceDashboard'

// Lazy load components for code splitting
const Navbar = createLazyRoute(
  () => import('./components/layout/Navbar'),
  { chunkName: 'navbar', fallbackType: 'default' }
)

const Home = createLazyRoute(
  () => import('./components/layout/Home'),
  { chunkName: 'home', fallbackType: 'default' }
)

// Auth pages
const SignIn = createLazyRoute(
  () => import('./components/auth/SignIn'),
  { chunkName: 'auth', fallbackType: 'auth' }
)

const SignUp = createLazyRoute(
  () => import('./components/auth/SignUp'),
  { chunkName: 'auth', fallbackType: 'auth' }
)

const EmailVerification = createLazyRoute(
  () => import('./components/auth/EmailVerification'),
  { chunkName: 'auth', fallbackType: 'auth' }
)

const VerifyEmail = createLazyRoute(
  () => import('./components/auth/VerifyEmail'),
  { chunkName: 'auth', fallbackType: 'auth' }
)

// Dashboard pages (preload for logged-in users)
const Dashboard = createLazyRoute(
  () => import('./components/pages/Dashboard'),
  { chunkName: 'dashboard', fallbackType: 'dashboard', preload: true }
)

const Customize = createLazyRoute(
  () => import('./components/pages/Customize'),
  { chunkName: 'customize', fallbackType: 'dashboard' }
)

const Links = createLazyRoute(
  () => import('./components/pages/Links'),
  { chunkName: 'links', fallbackType: 'dashboard' }
)

const Premium = createLazyRoute(
  () => import('./components/pages/Premium'),
  { chunkName: 'premium', fallbackType: 'default' }
)

const Templates = createLazyRoute(
  () => import('./components/pages/Templates'),
  { chunkName: 'templates', fallbackType: 'default' }
)

// User profile page
const UserProfile = createLazyRoute(
  () => import('./components/pages/UserProfile'),
  { chunkName: 'profile', fallbackType: 'profile' }
)

const TestCustomization = createLazyRoute(
  () => import('./components/pages/TestCustomization'),
  { chunkName: 'test-customization', fallbackType: 'default' }
)
import Loader from './components/ui/Loader'

const NavbarWrapper = () => {
  const location = useLocation()
  const hideNavbarRoutes = ['/signin', '/signup', '/email-verification', '/verify-email', '/dashboard', '/customize', '/links', '/premium', '/templates', '/test-customization']
  
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
    <ErrorProvider>
      <PerformanceProvider>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
        <main>
          <NetworkStatus />
          <Router>
            <RouteErrorBoundary name="navbar">
              <NavbarWrapper/>
            </RouteErrorBoundary>
            <RouteErrorBoundary name="routes">
              <Routes>
              {/* Public routes */}
              <Route path='/' element={<Home />}/>
              
              {/* Auth routes - redirect to dashboard if already logged in */}
              <Route path='/signin' element={
                <PublicRoute>
                  <SignIn />
                </PublicRoute>
              }/>
              <Route path='/signup' element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              }/>
              <Route path='/email-verification' element={
                <PublicRoute>
                  <EmailVerification />
                </PublicRoute>
              }/>
              <Route path='/verify-email' element={
                <PublicRoute>
                  <VerifyEmail />
                </PublicRoute>
              }/>
              
              {/* Protected routes - require authentication */}
              <Route path='/dashboard' element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }/>
              <Route path='/customize' element={
                <ProtectedRoute>
                  <Customize />
                </ProtectedRoute>
              }/>
              <Route path='/links' element={
                <ProtectedRoute>
                  <Links />
                </ProtectedRoute>
              }/>
              <Route path='/premium' element={
                <ProtectedRoute>
                  <Premium />
                </ProtectedRoute>
              }/>
              <Route path='/templates' element={
                <ProtectedRoute>
                  <Templates />
                </ProtectedRoute>
              }/>
              
              {/* Public info pages */}
              <Route path='/about' element={"About"}/>
              <Route path='/project' element={"Project"}/>
              <Route path='/contact' element={"Contact"}/>
              
              {/* Test customization page */}
              <Route path='/test-customization' element={<TestCustomization />}/>
              
              {/* Public user profiles */}
              <Route path='/:username' element={<UserProfile />}/>
              </Routes>
            </RouteErrorBoundary>
          </Router>
          <PerformanceToggle />
        </main>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </PerformanceProvider>
    </ErrorProvider>
  )
}

export default App