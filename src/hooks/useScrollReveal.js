import { useEffect } from 'react'

export const useScrollReveal = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -100px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add visible class with a small delay for smoother effect
          setTimeout(() => {
            entry.target.classList.add('visible')
          }, 50)
        }
      })
    }, observerOptions)

    // Observe all scroll reveal items
    const scrollElements = document.querySelectorAll('.scroll-reveal-item')

    scrollElements.forEach((el) => {
      observer.observe(el)
    })

    return () => {
      scrollElements.forEach((el) => {
        observer.unobserve(el)
      })
    }
  }, [])
}