import Redis from 'ioredis'

class RedisClient {
  constructor() {
    this.client = null
    this.isConnected = false
  }

  async connect() {
    if (this.client && this.isConnected) {
      return this.client
    }

    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        username: process.env.REDIS_USERNAME || 'default',
        db: parseInt(process.env.REDIS_DB) || 0,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
        keepAlive: 30000,
        connectionName: 'gotchu-app'
      })

      await this.client.connect()
      
      this.client.on('connect', () => {
        console.log('Redis connected successfully')
        this.isConnected = true
      })

      this.client.on('error', (err) => {
        console.error('Redis connection error:', err)
        this.isConnected = false
      })

      this.client.on('close', () => {
        console.log('Redis connection closed')
        this.isConnected = false
      })

      return this.client
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      throw error
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit()
      this.client = null
      this.isConnected = false
    }
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected. Call connect() first.')
    }
    return this.client
  }

  // Session methods
  async setSession(sessionId, userData, expirationInSeconds = 3600) {
    const client = this.getClient()
    const sessionKey = `session:${sessionId}`
    
    await client.setex(
      sessionKey, 
      expirationInSeconds, 
      JSON.stringify(userData)
    )
  }

  async getSession(sessionId) {
    const client = this.getClient()
    const sessionKey = `session:${sessionId}`
    
    const sessionData = await client.get(sessionKey)
    return sessionData ? JSON.parse(sessionData) : null
  }

  async deleteSession(sessionId) {
    const client = this.getClient()
    const sessionKey = `session:${sessionId}`
    
    await client.del(sessionKey)
  }

  async extendSession(sessionId, expirationInSeconds = 3600) {
    const client = this.getClient()
    const sessionKey = `session:${sessionId}`
    
    await client.expire(sessionKey, expirationInSeconds)
  }

  // User cache methods
  async cacheUser(userId, userData, expirationInSeconds = 1800) {
    const client = this.getClient()
    const userKey = `user:${userId}`
    
    await client.setex(
      userKey,
      expirationInSeconds,
      JSON.stringify(userData)
    )
  }

  async getCachedUser(userId) {
    const client = this.getClient()
    const userKey = `user:${userId}`
    
    const userData = await client.get(userKey)
    return userData ? JSON.parse(userData) : null
  }

  async invalidateUserCache(userId) {
    const client = this.getClient()
    const userKey = `user:${userId}`
    
    await client.del(userKey)
  }

  // Rate limiting methods
  async checkRateLimit(key, limit = 5, windowInSeconds = 300) {
    const client = this.getClient()
    const rateLimitKey = `rate_limit:${key}`
    
    const current = await client.incr(rateLimitKey)
    
    if (current === 1) {
      await client.expire(rateLimitKey, windowInSeconds)
    }
    
    return {
      count: current,
      limit,
      remaining: Math.max(0, limit - current),
      exceeded: current > limit
    }
  }

  // Generic cache methods
  async set(key, value, expirationInSeconds) {
    const client = this.getClient()
    
    if (expirationInSeconds) {
      await client.setex(key, expirationInSeconds, JSON.stringify(value))
    } else {
      await client.set(key, JSON.stringify(value))
    }
  }

  async get(key) {
    const client = this.getClient()
    
    const value = await client.get(key)
    return value ? JSON.parse(value) : null
  }

  async delete(key) {
    const client = this.getClient()
    await client.del(key)
  }

  async exists(key) {
    const client = this.getClient()
    return await client.exists(key)
  }
}

// Create singleton instance
const redisClient = new RedisClient()

export default redisClient