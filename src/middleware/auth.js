import AuthService from '../lib/auth.js'

// Authentication middleware for API routes
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const sessionId = req.headers['x-session-id']
    
    if (!authHeader && !sessionId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    let session = null

    // Try session-based auth first
    if (sessionId) {
      session = await AuthService.validateSession(sessionId)
    }

    // Fall back to JWT token auth
    if (!session && authHeader) {
      const token = authHeader.replace('Bearer ', '')
      
      try {
        const decoded = AuthService.verifyJWT(token)
        
        if (decoded.sessionId) {
          session = await AuthService.validateSession(decoded.sessionId)
        }
      } catch (jwtError) {
        return res.status(401).json({ 
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        })
      }
    }

    if (!session) {
      return res.status(401).json({ 
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION'
      })
    }

    // Get full user data
    const user = await AuthService.getUserById(session.userId)
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'User account not found or inactive',
        code: 'USER_INACTIVE'
      })
    }

    // Attach user to request
    req.user = user
    req.session = session
    
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({ 
      error: 'Internal authentication error',
      code: 'AUTH_ERROR'
    })
  }
}

// Optional authentication middleware (doesn't fail if not authenticated)
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const sessionId = req.headers['x-session-id']
    
    if (!authHeader && !sessionId) {
      req.user = null
      req.session = null
      return next()
    }

    let session = null

    // Try session-based auth first
    if (sessionId) {
      session = await AuthService.validateSession(sessionId)
    }

    // Fall back to JWT token auth
    if (!session && authHeader) {
      const token = authHeader.replace('Bearer ', '')
      
      try {
        const decoded = AuthService.verifyJWT(token)
        
        if (decoded.sessionId) {
          session = await AuthService.validateSession(decoded.sessionId)
        }
      } catch (jwtError) {
        // Silent fail for optional auth
        req.user = null
        req.session = null
        return next()
      }
    }

    if (session) {
      const user = await AuthService.getUserById(session.userId)
      
      if (user && user.isActive) {
        req.user = user
        req.session = session
      } else {
        req.user = null
        req.session = null
      }
    } else {
      req.user = null
      req.session = null
    }

    next()
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    req.user = null
    req.session = null
    next()
  }
}

// Rate limiting middleware
export async function rateLimitAuth(req, res, next) {
  try {
    const identifier = req.body.identifier || req.body.username || req.body.email
    
    if (!identifier) {
      return res.status(400).json({ 
        error: 'Missing identifier for rate limiting',
        code: 'MISSING_IDENTIFIER'
      })
    }

    const rateLimit = await AuthService.checkAuthRateLimit(identifier)
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': rateLimit.limit,
      'X-RateLimit-Remaining': rateLimit.remaining,
      'X-RateLimit-Reset': new Date(Date.now() + 300000).toISOString() // 5 minutes
    })

    next()
  } catch (error) {
    if (error.message.includes('Too many login attempts')) {
      return res.status(429).json({ 
        error: error.message,
        code: 'RATE_LIMITED'
      })
    }
    
    console.error('Rate limit middleware error:', error)
    return res.status(500).json({ 
      error: 'Internal rate limiting error',
      code: 'RATE_LIMIT_ERROR'
    })
  }
}

// Admin role middleware
export async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    })
  }

  if (req.user.plan !== 'admin' && req.user.plan !== 'staff') {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    })
  }

  next()
}

// Premium user middleware
export async function requirePremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    })
  }

  const premiumPlans = ['premium', 'pro', 'enterprise', 'admin', 'staff']
  
  if (!premiumPlans.includes(req.user.plan)) {
    return res.status(403).json({ 
      error: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED'
    })
  }

  next()
}

export default {
  requireAuth,
  optionalAuth,
  rateLimitAuth,
  requireAdmin,
  requirePremium
}