import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import redisClient from './redis.js'
import prisma from './prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
const SESSION_EXPIRY = 24 * 60 * 60 // 24 hours in seconds

export class AuthService {
  // Hash password
  static async hashPassword(password) {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  // Verify password
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword)
  }

  // Generate JWT token
  static generateJWT(payload) {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: '24h',
      issuer: 'gotchu.lol',
      audience: 'gotchu-users'
    })
  }

  // Verify JWT token
  static verifyJWT(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'gotchu.lol',
        audience: 'gotchu-users'
      })
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  // Generate session ID
  static generateSessionId() {
    return uuidv4()
  }

  // Create user session
  static async createSession(user) {
    await redisClient.connect()
    
    const sessionId = this.generateSessionId()
    const sessionData = {
      userId: user.id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
      plan: user.plan,
      createdAt: new Date().toISOString()
    }

    // Store session in Redis
    await redisClient.setSession(sessionId, sessionData, SESSION_EXPIRY)
    
    // Cache user data
    await redisClient.cacheUser(user.id, {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      plan: user.plan,
      theme: user.theme,
      isActive: user.isActive
    })

    return {
      sessionId,
      token: this.generateJWT({ userId: user.id, sessionId }),
      user: sessionData
    }
  }

  // Get session
  static async getSession(sessionId) {
    await redisClient.connect()
    return await redisClient.getSession(sessionId)
  }

  // Validate session and get user
  static async validateSession(sessionId) {
    const session = await this.getSession(sessionId)
    if (!session) {
      return null
    }

    // Extend session
    await redisClient.extendSession(sessionId, SESSION_EXPIRY)
    
    return session
  }

  // Destroy session
  static async destroySession(sessionId) {
    await redisClient.connect()
    await redisClient.deleteSession(sessionId)
  }

  // Register new user
  static async register({ username, email, password }) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      }
    })

    if (existingUser) {
      if (existingUser.username === username.toLowerCase()) {
        throw new Error('Username already exists')
      }
      if (existingUser.email === email.toLowerCase()) {
        throw new Error('Email already exists')
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        displayName: username, // Use username as initial display name
        // Password will be stored in a separate auth table or handled by Supabase
        // For now, we'll store the hash in a temporary field
        bio: `Welcome to ${username}'s profile!`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // TODO: Store password hash in separate auth table or use Supabase Auth
    // For demo purposes, we'll skip password storage

    return user
  }

  // Login user
  static async login({ identifier, password }) {
    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier.toLowerCase() },
          { email: identifier.toLowerCase() }
        ],
        isActive: true
      }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // TODO: Verify password from auth table or Supabase
    // For demo purposes, we'll skip password verification
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Create session
    return await this.createSession(user)
  }

  // Get user by ID with caching
  static async getUserById(userId) {
    await redisClient.connect()
    
    // Try to get from cache first
    let user = await redisClient.getCachedUser(userId)
    
    if (!user) {
      // Get from database
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          isVerified: true,
          plan: true,
          theme: true,
          isActive: true,
          profileViews: true,
          totalClicks: true,
          createdAt: true,
          lastLoginAt: true
        }
      })

      if (user) {
        // Cache for 30 minutes
        await redisClient.cacheUser(userId, user, 1800)
      }
    }

    return user
  }

  // Rate limiting for authentication
  static async checkAuthRateLimit(identifier) {
    await redisClient.connect()
    
    const rateLimitKey = `auth:${identifier}`
    const result = await redisClient.checkRateLimit(rateLimitKey, 5, 300) // 5 attempts per 5 minutes
    
    if (result.exceeded) {
      throw new Error(`Too many login attempts. Please try again in 5 minutes.`)
    }
    
    return result
  }

  // Clear rate limit (on successful login)
  static async clearAuthRateLimit(identifier) {
    await redisClient.connect()
    const rateLimitKey = `auth:${identifier}`
    await redisClient.delete(rateLimitKey)
  }
}

export default AuthService