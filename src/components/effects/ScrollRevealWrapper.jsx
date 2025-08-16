import React, { useEffect, useRef, useState } from 'react'

const ScrollRevealWrapper = ({ children, className = '', direction = 'up' }) => {
  const elementRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Simple Intersection Observer for scroll reveal
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element is coming into view
            setIsVisible(true)
            element.classList.add('visible')
            element.classList.remove('exiting')
          } else {
            // Element is going out of view
            const rect = entry.boundingClientRect
            if (rect.top > 0) {
              // Element is below viewport (not yet reached)
              setIsVisible(false)
              element.classList.remove('visible', 'exiting')
            } else {
              // Element is above viewport (scrolled past)
              setIsVisible(false)
              element.classList.remove('visible')
              element.classList.add('exiting')
            }
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '-10% 0px -10% 0px' // Only trigger when element is well within viewport
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [])

  const revealClass = `scroll-reveal-${direction}`
  
  return (
    <div 
      ref={elementRef} 
      className={`${revealClass} ${className}`}
      style={{ 
        opacity: 0,
        transform: direction === 'up' ? 'translateY(50px)' :
                  direction === 'left' ? 'translateX(-50px)' :
                  direction === 'right' ? 'translateX(50px)' :
                  direction === 'scale' ? 'scale(0.8)' : 'translateY(50px)'
      }}
    >
      {children}
    </div>
  )
}

export default ScrollRevealWrapper