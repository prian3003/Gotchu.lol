import { useState, useCallback, useRef } from 'react'

export const useTurnstile = () => {
  const [isVerified, setIsVerified] = useState(false)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const turnstileRef = useRef()

  const handleVerify = useCallback((turnstileToken) => {
    setToken(turnstileToken)
    setIsVerified(true)
    setError('')
    setIsLoading(false)
  }, [])

  const handleError = useCallback((errorMessage) => {
    setError(typeof errorMessage === 'string' ? errorMessage : 'Verification failed. Please try again.')
    setIsVerified(false)
    setToken('')
    setIsLoading(false)
  }, [])

  const handleExpire = useCallback(() => {
    setIsVerified(false)
    setToken('')
    setError('Verification expired. Please verify again.')
    setIsLoading(false)
  }, [])

  const reset = useCallback(() => {
    setIsVerified(false)
    setToken('')
    setError('')
    setIsLoading(false)
    if (turnstileRef.current) {
      turnstileRef.current.reset()
    }
  }, [])

  const execute = useCallback(() => {
    setIsLoading(true)
    setError('')
    if (turnstileRef.current) {
      turnstileRef.current.execute()
    }
  }, [])

  return {
    // State
    isVerified,
    token,
    error,
    isLoading,
    
    // Handlers
    handleVerify,
    handleError,
    handleExpire,
    
    // Controls
    reset,
    execute,
    turnstileRef
  }
}