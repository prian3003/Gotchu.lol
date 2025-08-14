import React, { useState, useEffect, useRef } from 'react'

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const cursorRef = useRef(null)
  const cometRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const updateMousePosition = (e) => {
      const newPosition = { x: e.clientX, y: e.clientY }
      
      // Cancel previous animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      
      // Use requestAnimationFrame for smooth updates
      rafRef.current = requestAnimationFrame(() => {
        setMousePosition(newPosition)
        
        // Direct DOM manipulation for better performance
        if (cursorRef.current) {
          const scale = isHovering ? 1.5 : 1
          cursorRef.current.style.transform = `translate3d(${newPosition.x - 4}px, ${newPosition.y - 4}px, 0) scale(${scale})`
        }
        
        if (cometRef.current) {
          const scale = isHovering ? 1.3 : 1
          cometRef.current.style.transform = `translate3d(${newPosition.x - 16}px, ${newPosition.y - 16}px, 0) scale(${scale})`
        }
      })
      
      setIsVisible(true)
    }

    const handleMouseOver = (e) => {
      const target = e.target
      const isInteractive = target.matches('button, a, input, textarea, select, [role="button"], .cursor-pointer, [onclick]') ||
                           target.closest('button, a, input, textarea, select, [role="button"], .cursor-pointer, [onclick]')
      setIsHovering(isInteractive)
      setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
      setIsHovering(false)
    }

    // Add mouse event listeners with passive option for better performance
    document.addEventListener('mousemove', updateMousePosition, { passive: true })
    document.addEventListener('mouseover', handleMouseOver, { passive: true })
    document.addEventListener('mouseenter', updateMousePosition, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    return () => {
      document.removeEventListener('mousemove', updateMousePosition)
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseenter', updateMousePosition)
      document.removeEventListener('mouseleave', handleMouseLeave)
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isHovering])

  if (!isVisible) return null

  return (
    <>
      {/* Main cursor dot - Ultra smooth with hardware acceleration */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-2 h-2 pointer-events-none z-[99999]"
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transform: `translate3d(${mousePosition.x - 4}px, ${mousePosition.y - 4}px, 0)`,
          background: isHovering 
            ? 'radial-gradient(circle, rgba(169,204,62,0.9) 0%, rgba(169,204,62,0.6) 100%)'
            : 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
          borderRadius: '50%',
          mixBlendMode: isHovering ? 'normal' : 'difference',
          filter: isHovering ? 'blur(0px)' : 'blur(0.5px)',
          transition: 'background 0.2s ease, filter 0.2s ease, mix-blend-mode 0.2s ease',
        }}
      />
      
      {/* Glowing comet effect with smooth follow */}
      <div
        ref={cometRef}
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[99998]"
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transform: `translate3d(${mousePosition.x - 16}px, ${mousePosition.y - 16}px, 0)`,
          background: isHovering
            ? 'radial-gradient(circle, rgba(169,204,62,0.4) 0%, rgba(169,204,62,0.2) 40%, rgba(169,204,62,0.1) 70%, transparent 100%)'
            : 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, rgba(99,102,241,0.4) 40%, rgba(34,211,238,0.2) 70%, transparent 100%)',
          boxShadow: isHovering
            ? `0 0 20px 3px rgba(169, 204, 62, 0.3),
               0 0 35px 6px rgba(169, 204, 62, 0.2),
               0 0 50px 10px rgba(169, 204, 62, 0.1)`
            : `0 0 20px 3px rgba(168, 85, 247, 0.4),
               0 0 35px 6px rgba(99, 102, 241, 0.3),
               0 0 50px 10px rgba(34, 211, 238, 0.2)`,
          borderRadius: '50%',
          opacity: 0.8,
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
      />

      {/* Simple CSS for cursor */}
      <style jsx="true" global="true">{`
        /* Hide default cursor */
        * {
          cursor: none !important;
        }
        
        /* Allow text selection where needed */
        input, textarea, [contenteditable] {
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
      `}</style>
    </>
  )
}

export default CustomCursor