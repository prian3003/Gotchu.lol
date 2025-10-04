import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { registerUser, loginUser, logoutUser, getCurrentUser, refreshSession } from '../api/auth.js'
import { requireAuth, optionalAuth, rateLimitAuth } from '../middleware/auth.js'
import redisClient from '../lib/redis.js'

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}))

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_SITE_URL, 'https://gotchu.lol'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(globalLimiter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API Routes

// Auth routes
app.post('/api/auth/register', rateLimitAuth, registerUser)
app.post('/api/auth/login', rateLimitAuth, loginUser)
app.post('/api/auth/logout', optionalAuth, logoutUser)
app.get('/api/auth/me', requireAuth, getCurrentUser)
app.post('/api/auth/refresh', refreshSession)

// Protected dashboard route
app.get('/api/dashboard', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to your dashboard',
    data: {
      user: req.user,
      stats: {
        profileViews: req.user.profileViews || 0,
        totalClicks: req.user.totalClicks || 0,
        joinDate: req.user.createdAt,
        lastActive: req.user.lastLoginAt
      }
    }
  })
})

// User profile routes
app.get('/api/users/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params
    
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isVerified: true,
        theme: true,
        profileViews: true,
        createdAt: true,
        links: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            url: true,
            description: true,
            icon: true,
            imageUrl: true,
            color: true,
            type: true,
            clicks: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      })
    }

    // Increment profile view (if not viewing own profile)
    if (!req.user || req.user.id !== user.id) {
      // TODO: Track profile view with analytics
    }

    res.json({
      success: true,
      data: { user }
    })

  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({
      error: 'Failed to get user profile',
      code: 'PROFILE_ERROR'
    })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND'
  })
})

// Initialize Redis connection
async function initializeApp() {
  try {
    await redisClient.connect()
    
    app.listen(PORT, () => {
    })
  } catch (error) {
    console.error('Failed to initialize app:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redisClient.disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await redisClient.disconnect()
  process.exit(0)
})

// Start the server
if (process.env.NODE_ENV !== 'test') {
  initializeApp()
}

export default app