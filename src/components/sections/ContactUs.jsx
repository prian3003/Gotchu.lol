import React, { useState } from 'react'
import ParticleBackgroundNeutral from '../effects/ParticleBackgroundNeutral'
import ShinyText from '../effects/ShinyText'
import { useTheme } from '../../contexts/ThemeContext'

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const { colors, isDarkMode } = useTheme()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission here
    // Handle form submission here
  }

  return (
    <section id="contact" className="relative min-h-screen overflow-hidden" style={{background: colors.background}}>
      {/* Particle Background */}
      <ParticleBackgroundNeutral />
      
      {/* Large Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-165">
        <ShinyText
          size="4xl"
          weight="extrabold"
          speed={4}
          baseColor={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(19, 21, 21, 0.08)"}
          shineColor={isDarkMode ? "rgba(169, 204, 62, 0.3)" : "rgba(169, 204, 62, 0.4)"}
          intensity={1}
          direction="left-to-right"
          shineWidth={30}
          repeat="infinite"
          className="text-[18vw] dm-serif-text-regular tracking-tight leading-none select-none uppercase"
        >
          Get In Touch
        </ShinyText>
      </div>
      
      {/* Content */}
      <div className="relative z-10 px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{color: colors.text}}>
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Get In Touch
              </span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{color: colors.textSecondary}}>
              Ready to bring your vision to life? Let's create something extraordinary together.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* SVG Illustration */}
            <div className="relative">
              <div className="floating-envelope">
                <svg
                  width="400"
                  height="400"
                  viewBox="0 0 400 400"
                  className="w-full h-auto max-w-md mx-auto"
                >
                  {/* Background Circle */}
                  <circle
                    cx="200"
                    cy="200"
                    r="180"
                    fill="url(#bgGradient)"
                    opacity="0.1"
                  />
                  
                  {/* Stars */}
                  <g className="blinking-stars">
                    <circle cx="80" cy="80" r="2" fill="#22d3ee" className="star-1" />
                    <circle cx="320" cy="100" r="1.5" fill="#a855f7" className="star-2" />
                    <circle cx="60" cy="320" r="1" fill="#6366f1" className="star-3" />
                    <circle cx="340" cy="300" r="2" fill="#22d3ee" className="star-4" />
                    <circle cx="120" cy="50" r="1" fill="#a855f7" className="star-5" />
                    <circle cx="350" cy="180" r="1.5" fill="#6366f1" className="star-6" />
                  </g>

                  {/* Envelope */}
                  <g className="envelope-group" transform="translate(200, 200)">
                    {/* Envelope Body */}
                    <rect
                      x="-60"
                      y="-30"
                      width="120"
                      height="80"
                      rx="8"
                      fill="url(#envelopeGradient)"
                      stroke="url(#borderGradient)"
                      strokeWidth="2"
                    />
                    
                    {/* Envelope Flap */}
                    <path
                      d="M -60 -30 L 0 20 L 60 -30 Z"
                      fill="url(#flapGradient)"
                      stroke="url(#borderGradient)"
                      strokeWidth="2"
                    />
                    
                    {/* Envelope Lines */}
                    <line x1="-40" y1="-10" x2="40" y2="-10" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="-40" y1="5" x2="20" y2="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="-40" y1="20" x2="30" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  </g>

                  {/* Floating Elements */}
                  <g className="floating-elements">
                    <circle cx="100" cy="150" r="3" fill="url(#dotGradient)" className="float-1" />
                    <circle cx="300" cy="250" r="2" fill="url(#dotGradient)" className="float-2" />
                    <rect x="280" y="120" width="4" height="4" rx="1" fill="url(#dotGradient)" className="float-3" />
                  </g>

                  {/* Gradients */}
                  <defs>
                    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    
                    <linearGradient id="envelopeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                    </linearGradient>
                    
                    <linearGradient id="flapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(34,211,238,0.3)" />
                      <stop offset="100%" stopColor="rgba(99,102,241,0.2)" />
                    </linearGradient>
                    
                    <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    
                    <radialGradient id="dotGradient">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Contact Form */}
            <div className="backdrop-blur-sm rounded-xl p-8" style={{
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(19,21,21,0.05)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(19,21,21,0.1)',
              border: '1px solid'
            }}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2" style={{color: colors.textSecondary}}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(19,21,21,0.05)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(19,21,21,0.2)',
                      border: '1px solid',
                      color: colors.text
                    }}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2" style={{color: colors.textSecondary}}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(19,21,21,0.05)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(19,21,21,0.2)',
                      border: '1px solid',
                      color: colors.text
                    }}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2" style={{color: colors.textSecondary}}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 resize-none"
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(19,21,21,0.05)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(19,21,21,0.2)',
                      border: '1px solid',
                      color: colors.text
                    }}
                    placeholder="Tell us about your project..."
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Send Message
                </button>
              </form>

              {/* Contact Info */}
              <div className="mt-8 pt-8 border-t" style={{
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(19,21,21,0.1)'
              }}>
                <div className="grid sm:grid-cols-2 gap-4 text-sm" style={{color: colors.textSecondary}}>
                  <div>
                    <p className="font-medium mb-1" style={{color: colors.text}}>Email</p>
                    <p>hello@eamaginelabs.com</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1" style={{color: colors.text}}>Response Time</p>
                    <p>Within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        .floating-envelope {
          animation: float-envelope 6s ease-in-out infinite;
        }

        .envelope-group {
          animation: gentle-float 4s ease-in-out infinite;
        }

        .blinking-stars .star-1 {
          animation: blink-star 2s ease-in-out infinite;
        }
        
        .blinking-stars .star-2 {
          animation: blink-star 2.5s ease-in-out infinite 0.5s;
        }
        
        .blinking-stars .star-3 {
          animation: blink-star 3s ease-in-out infinite 1s;
        }
        
        .blinking-stars .star-4 {
          animation: blink-star 2.2s ease-in-out infinite 1.5s;
        }
        
        .blinking-stars .star-5 {
          animation: blink-star 2.8s ease-in-out infinite 2s;
        }
        
        .blinking-stars .star-6 {
          animation: blink-star 2.3s ease-in-out infinite 0.8s;
        }

        .floating-elements .float-1 {
          animation: float-element 5s ease-in-out infinite;
        }
        
        .floating-elements .float-2 {
          animation: float-element 4s ease-in-out infinite 1s;
        }
        
        .floating-elements .float-3 {
          animation: float-element 6s ease-in-out infinite 2s;
        }

        @keyframes float-envelope {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes gentle-float {
          0%, 100% {
            transform: translate(200px, 200px) translateY(0px);
          }
          50% {
            transform: translate(200px, 200px) translateY(-5px);
          }
        }

        @keyframes blink-star {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes float-element {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.6;
          }
          33% {
            transform: translateY(-8px) translateX(2px);
            opacity: 1;
          }
          66% {
            transform: translateY(4px) translateX(-2px);
            opacity: 0.8;
          }
        }
      `}</style>
    </section>
  )
}

export default ContactUs