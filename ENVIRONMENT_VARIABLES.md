# Environment Variables Documentation

This document describes all environment variables used in the Gotchu backend application.

## Required Variables

### Database Configuration
```env
DATABASE_URL=postgresql://user:password@host:port/dbname
```
PostgreSQL database connection string.

### Redis Configuration
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```
Redis server connection details.

### JWT Configuration
```env
JWT_SECRET=your_super_secret_jwt_key_here
```
Secret key for JWT token signing. Must be strong and unique.

## Optional Variables

### Server Configuration
```env
PORT=8080                    # Server port (default: 8080)
GIN_MODE=debug              # Gin mode: debug, release (default: debug)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173  # Allowed CORS origins
```

### Database Options
```env
DIRECT_URL=                 # Direct database URL (for migrations)
MIGRATE=true               # Run migrations on startup (default: true)
```

### Redis Authentication
```env
REDIS_PASSWORD=            # Redis password (if required)
REDIS_USERNAME=default     # Redis username (default: default)
REDIS_DB=0                 # Redis database number (default: 0)
```

### Rate Limiting
```env
RATE_LIMIT_WINDOW=300      # Rate limit window in seconds (default: 300)
RATE_LIMIT_MAX=100         # Max requests per window (default: 100)
AUTH_RATE_LIMIT_MAX=5      # Max auth requests per window (default: 5)
SESSION_EXPIRY=86400       # Session expiry in seconds (default: 86400)
```

### Supabase Integration (Optional)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Discord Integration (Optional)
```env
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:5173/auth/discord/callback
DISCORD_GUILD_ID=your_discord_guild_id
```

### Google OAuth (Optional)
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Email Service (Optional)
```env
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### Cloudflare Turnstile (Optional)
```env
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=your_site_key
CLOUDFLARE_TURNSTILE_SECRET_KEY=your_secret_key
```

### Site Configuration
```env
SITE_URL=https://yourdomain.com  # Your website URL (required for webhooks)
```

### NOW Payments Integration
```env
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
NOWPAYMENTS_IPN_SECRET=your_nowpayments_ipn_secret
NOWPAYMENTS_SANDBOX=true   # true for testing, false for production
```

## Environment-Specific Examples

### Development Environment (.env.local)
```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/gotchu_dev
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_dev_jwt_secret_here

# Optional Development Settings
PORT=8080
GIN_MODE=debug
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
SITE_URL=http://localhost:5173

# NOW Payments Sandbox
NOWPAYMENTS_API_KEY=your_sandbox_api_key
NOWPAYMENTS_IPN_SECRET=your_sandbox_ipn_secret
NOWPAYMENTS_SANDBOX=true

# Optional Services (for development)
RESEND_API_KEY=your_resend_key
DISCORD_BOT_TOKEN=your_discord_bot_token
```

### Production Environment
```env
# Required
DATABASE_URL=postgresql://user:password@prod-host:5432/gotchu_prod
REDIS_HOST=redis-prod-host
REDIS_PORT=6379
REDIS_PASSWORD=strong_redis_password
JWT_SECRET=super_strong_production_jwt_secret

# Production Settings
PORT=8080
GIN_MODE=release
CORS_ORIGINS=https://yourdomain.com
SITE_URL=https://yourdomain.com

# NOW Payments Production
NOWPAYMENTS_API_KEY=your_production_api_key
NOWPAYMENTS_IPN_SECRET=your_production_ipn_secret
NOWPAYMENTS_SANDBOX=false

# Production Services
RESEND_API_KEY=your_production_resend_key
DISCORD_BOT_TOKEN=your_production_discord_token
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_key
```

## Security Notes

### JWT Secret
- Must be at least 32 characters long
- Use a cryptographically secure random generator
- Different secrets for development and production
- Never commit secrets to version control

### Database Security
- Use strong passwords
- Enable SSL for production databases
- Restrict database access to application servers only

### Redis Security
- Use authentication in production
- Configure firewall rules
- Use TLS encryption for production

### NOW Payments Security
- Keep API keys secure and private
- Use different keys for sandbox and production
- IPN Secret must be kept confidential
- Verify webhook signatures always

## Environment Loading

The application loads environment variables in this order:
1. System environment variables
2. `.env` file in the project root
3. Default values (where specified)

## Validation

The application will exit with an error if required environment variables are missing:
- `DATABASE_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `JWT_SECRET`

Optional variables have sensible defaults and won't prevent startup if missing.

## Development Tips

### Using Multiple Environments
```bash
# Development
cp .env.example .env.local
# Edit .env.local with development settings

# Staging
cp .env.example .env.staging
# Edit .env.staging with staging settings

# Load specific environment
export ENV_FILE=.env.staging
go run cmd/main.go
```

### Environment Validation Script
Create a script to validate your environment:

```bash
#!/bin/bash
# validate-env.sh

required_vars=(
    "DATABASE_URL"
    "REDIS_HOST"
    "REDIS_PORT"
    "JWT_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

echo "🎉 All required environment variables are configured!"
```

## Common Issues

### Database Connection Issues
- Verify DATABASE_URL format is correct
- Check database server is running and accessible
- Ensure database exists and user has proper permissions

### Redis Connection Issues
- Verify Redis server is running
- Check REDIS_HOST and REDIS_PORT are correct
- Test Redis authentication if using password

### Payment Integration Issues
- Verify NOW Payments API key is valid
- Check SITE_URL is accessible from external services
- Ensure webhook endpoint is properly configured

### CORS Issues
- Update CORS_ORIGINS to include your frontend domain
- Ensure protocol (http/https) matches your frontend

## Security Best Practices

1. **Never commit environment files** - Add `.env*` to `.gitignore`
2. **Use different secrets** for each environment
3. **Rotate secrets regularly** in production
4. **Use environment-specific databases** - Don't share databases between environments
5. **Monitor access logs** for unauthorized attempts
6. **Use HTTPS in production** for all external communication

## Backup and Recovery

### Environment Backup
```bash
# Backup current environment (excluding sensitive data)
cp .env .env.backup.$(date +%Y%m%d)
```

### Recovery Checklist
- [ ] Database connection restored
- [ ] Redis connection restored
- [ ] JWT secret configured
- [ ] External service credentials updated
- [ ] Webhook endpoints accessible
- [ ] SSL certificates valid

## Monitoring

Monitor these environment-related metrics:
- Database connection pool utilization
- Redis connection health
- API key validity (NOW Payments)
- SSL certificate expiration
- Webhook delivery success rate