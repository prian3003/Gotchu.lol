import { useState, useEffect, useRef } from 'react'

export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || !('IntersectionObserver' in window)) {
      setIsIntersecting(true)
      setHasIntersected(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        rootMargin: '100px', // Load content 100px before it becomes visible
        threshold: 0.1,
        ...options
      }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [hasIntersected, options])

  return [elementRef, isIntersecting, hasIntersected]
}

export default useIntersectionObserver