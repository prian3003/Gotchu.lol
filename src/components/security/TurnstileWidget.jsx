import React, { useCallback, useRef, useImperativeHandle, forwardRef } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { useTheme } from '../../contexts/ThemeContext'

const TurnstileWidget = forwardRef(({ onVerify, onError, onExpire, size = 'normal', disabled = false }, ref) => {
  const { isDarkMode } = useTheme()
  const turnstileRef = useRef()
  
  // Get site key from environment
  const siteKey = import.meta.env.VITE_CLOUDFLARE_SITE_KEY || '1x00000000000000000000AA' // Fallback to test key
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (turnstileRef.current) {
        turnstileRef.current.reset()
      }
    },
    execute: () => {
      if (turnstileRef.current) {
        turnstileRef.current.execute()
      }
    },
    remove: () => {
      if (turnstileRef.current) {
        turnstileRef.current.remove()
      }
    }
  }))

  const handleVerify = useCallback((token) => {
    if (onVerify) {
      onVerify(token)
    }
  }, [onVerify])

  const handleError = useCallback((error) => {
    console.error('Turnstile error:', error)
    if (onError) {
      onError(error)
    }
  }, [onError])

  const handleExpire = useCallback(() => {
    console.warn('Turnstile token expired')
    if (onExpire) {
      onExpire()
    }
  }, [onExpire])

  const handleTimeout = useCallback(() => {
    console.warn('Turnstile timeout')
    if (onError) {
      onError('Verification timeout. Please try again.')
    }
  }, [onError])

  // Don't render if no site key
  if (!siteKey) {
    console.warn('Cloudflare Turnstile site key not found')
    return null
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      margin: '1rem 0',
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : 'auto'
    }}>
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
        onTimeout={handleTimeout}
        options={{
          theme: isDarkMode ? 'dark' : 'light',
          size: size,
          action: 'auth', // Custom action for analytics
          cData: 'gotchu-auth', // Custom data
          retry: 'auto',
          'retry-interval': 8000,
          'refresh-expired': 'auto'
        }}
        id="turnstile-widget"
      />
    </div>
  )
})

TurnstileWidget.displayName = 'TurnstileWidget'

export default TurnstileWidget