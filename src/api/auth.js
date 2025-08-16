import AuthService from '../lib/auth.js'
import { rateLimitAuth } from '../middleware/auth.js'

// Register endpoint
export async function registerUser(req, res) {
  try {
    const { username, email, password } = req.body

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required',
        code: 'MISSING_FIELDS'
      })
    }

    // Username validation
    if (username.length < 3) {
      return res.status(400).json({
        error: 'Username must be at least 3 characters long',
        code: 'INVALID_USERNAME'
      })
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        error: 'Username can only contain letters, numbers, and underscores',
        code: 'INVALID_USERNAME'
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Please provide a valid email address',
        code: 'INVALID_EMAIL'
      })
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      })
    }

    // Check rate limiting
    await AuthService.checkAuthRateLimit(email)

    // Register user
    const user = await AuthService.register({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password
    })

    // Create session
    const authData = await AuthService.createSession(user)

    // Clear rate limit on successful registration
    await AuthService.clearAuthRateLimit(email)

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: authData.user,
        sessionId: authData.sessionId,
        token: authData.token
      }
    })

  } catch (error) {
    console.error('Registration error:', error)

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: error.message,
        code: 'USER_EXISTS'
      })
    }

    if (error.message.includes('Too many login attempts')) {
      return res.status(429).json({
        error: error.message,
        code: 'RATE_LIMITED'
      })
    }

    return res.status(500).json({
      error: 'Failed to create account. Please try again.',
      code: 'REGISTRATION_ERROR'
    })
  }
}

// Login endpoint
export async function loginUser(req, res) {
  try {
    const { identifier, password } = req.body

    // Validation
    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Username/email and password are required',
        code: 'MISSING_CREDENTIALS'
      })
    }

    // Check rate limiting
    await AuthService.checkAuthRateLimit(identifier)

    // Login user
    const authData = await AuthService.login({
      identifier: identifier.trim().toLowerCase(),
      password
    })

    // Clear rate limit on successful login
    await AuthService.clearAuthRateLimit(identifier)

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: authData.user,
        sessionId: authData.sessionId,
        token: authData.token
      }
    })

  } catch (error) {
    console.error('Login error:', error)

    if (error.message.includes('Invalid credentials')) {
      return res.status(401).json({
        error: 'Invalid username/email or password',
        code: 'INVALID_CREDENTIALS'
      })
    }

    if (error.message.includes('Too many login attempts')) {
      return res.status(429).json({
        error: error.message,
        code: 'RATE_LIMITED'
      })
    }

    return res.status(500).json({
      error: 'Login failed. Please try again.',
      code: 'LOGIN_ERROR'
    })
  }
}

// Logout endpoint
export async function logoutUser(req, res) {
  try {
    const sessionId = req.headers['x-session-id'] || req.session?.sessionId

    if (sessionId) {
      await AuthService.destroySession(sessionId)
    }

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    })
  }
}

// Get current user endpoint
export async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
        session: req.session
      }
    })

  } catch (error) {
    console.error('Get current user error:', error)
    return res.status(500).json({
      error: 'Failed to get user data',
      code: 'USER_DATA_ERROR'
    })
  }
}

// Refresh session endpoint
export async function refreshSession(req, res) {
  try {
    const sessionId = req.headers['x-session-id']

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID required',
        code: 'MISSING_SESSION_ID'
      })
    }

    const session = await AuthService.validateSession(sessionId)

    if (!session) {
      return res.status(401).json({
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION'
      })
    }

    // Generate new token
    const newToken = AuthService.generateJWT({ 
      userId: session.userId, 
      sessionId 
    })

    return res.status(200).json({
      success: true,
      message: 'Session refreshed',
      data: {
        token: newToken,
        session
      }
    })

  } catch (error) {
    console.error('Refresh session error:', error)
    return res.status(500).json({
      error: 'Failed to refresh session',
      code: 'SESSION_REFRESH_ERROR'
    })
  }
}

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshSession
}