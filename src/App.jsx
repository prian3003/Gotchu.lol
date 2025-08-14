import React, { useState, useEffect } from 'react'
import {Route,BrowserRouter as Router,Routes} from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Navbar from './components/Navbar'
import Home from './components/Home'
import CustomCursor from './components/CustomCursor'
import Loader from './components/Loader'

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
        <CustomCursor />
        <Router>
          <Navbar/>
          <Routes>
            <Route path='/' element={<Home />}/>
            <Route path='/about' element={"About"}/>
            <Route path='/project' element={"Project"}/>
            <Route path='/contact' element={"Contact"}/>
          </Routes>
        </Router>
      </main>
    </ThemeProvider>
  )
}

export default App