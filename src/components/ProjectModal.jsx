import React, { useEffect, useState } from 'react'

const ProjectModal = ({ isOpen, onClose, project }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setTimeout(() => setIsAnimating(true), 50)
    } else {
      setIsAnimating(false)
      setTimeout(() => setIsVisible(false), 500)
    }
  }, [isOpen])

  if (!isVisible || !project) return null

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 500) // Match animation duration
  }

  const projectData = {
    Skip: {
      client: "Skip",
      industry: "software",
      services: ["brand strategy", "graphic design", "web design", "web development"],
      technologies: ["React", "Next.js", "Payload"],
      description: "The new Skip framework gives all software engineers the superpower of \"freezing time\", making it easier to build complex backend systems using the same reactive paradigm that scaled Meta to support billions of users.",
      additionalInfo: "We gave Skip a quirky logo and fun brand identity inspired by vintage computing. Stay tuned for the upcoming Next.js + Payload powered website currently under development by candycode!",
      logo: "SKIP"
    },
    Payload: {
      client: "Payload",
      industry: "software",
      services: ["brand strategy", "graphic design", "web design", "web development"],
      technologies: ["React", "Next.js", "TypeScript"],
      description: "Payload is a modern headless CMS that provides developers with a powerful backend for building applications with ease.",
      additionalInfo: "A complete redesign of the developer experience with modern tooling and intuitive interfaces.",
      logo: "PAYLOAD"
    }
  }

  const data = projectData[project.title] || projectData.Skip

  return (
    <div className={`fixed inset-0 z-[60000] flex items-center justify-center p-4 transition-all duration-500 ${
      isAnimating ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-all duration-500 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-7xl max-h-[95vh] overflow-y-auto rounded-2xl transition-all duration-500 transform-gpu ${
          isAnimating 
            ? 'scale-100 opacity-100 rotate-0' 
            : 'scale-90 opacity-0 rotate-1'
        }`}
        style={{
          background: "#131515",
          transformOrigin: 'center center',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
        >
          <span className="text-white text-2xl font-light">×</span>
        </button>

        {/* Header */}
        <div className="px-16 pt-16 pb-10">
          <h1 className="text-5xl md:text-7xl font-light text-white/90 leading-tight mb-8">
            Making software fun with the power of reactive programming.
          </h1>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 px-16 pb-16">
          {/* Left Column */}
          <div className="space-y-10">
            {/* Client */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">CLIENT</h3>
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white/40" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M6 0L7.5 4.5H12L8.25 7.5L9.75 12L6 9L2.25 12L3.75 7.5L0 4.5H4.5L6 0Z"/>
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-light text-white">{data.client}</p>
            </div>

            {/* Industry */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">INDUSTRY</h3>
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white/40" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M6 0L7.5 4.5H12L8.25 7.5L9.75 12L6 9L2.25 12L3.75 7.5L0 4.5H4.5L6 0Z"/>
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-light text-white">{data.industry}</p>
            </div>

            {/* Services */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">SERVICES</h3>
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white/40" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M6 0L7.5 4.5H12L8.25 7.5L9.75 12L6 9L2.25 12L3.75 7.5L0 4.5H4.5L6 0Z"/>
                  </svg>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {data.services.map((service, index) => (
                  <span 
                    key={index}
                    className="px-4 py-2 bg-white/10 rounded-full text-sm text-white/80 border border-white/20"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {/* Technologies */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">TECHNOLOGIES</h3>
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white/40" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M6 0L7.5 4.5H12L8.25 7.5L9.75 12L6 9L2.25 12L3.75 7.5L0 4.5H4.5L6 0Z"/>
                  </svg>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {data.technologies.map((tech, index) => (
                  <span 
                    key={index}
                    className="px-4 py-2 bg-white/5 rounded-full text-sm text-white/60 border border-white/10"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-10">
            {/* Project */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">PROJECT</h3>
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white/40" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M6 0L7.5 4.5H12L8.25 7.5L9.75 12L6 9L2.25 12L3.75 7.5L0 4.5H4.5L6 0Z"/>
                  </svg>
                </div>
              </div>
              <div className="space-y-8">
                <p className="text-xl text-white/80 leading-relaxed">
                  {data.description}
                </p>
                <p className="text-xl text-white/80 leading-relaxed">
                  {data.additionalInfo}
                </p>
              </div>
            </div>

            {/* Logo */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">LOGO</h3>
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white/40" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M6 0L7.5 4.5H12L8.25 7.5L9.75 12L6 9L2.25 12L3.75 7.5L0 4.5H4.5L6 0Z"/>
                  </svg>
                </div>
              </div>
              <div className="w-full h-32 bg-gradient-to-r from-[#A9CC3E]/20 to-cyan-400/20 rounded-xl flex items-center justify-center border border-white/10">
                <span className="text-2xl font-bold text-white/60 tracking-wider">
                  {data.logo}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute right-6 bottom-6">
          <div className="w-1 h-16 bg-white/10 rounded-full overflow-hidden">
            <div className="w-full h-8 bg-gradient-to-b from-[#A9CC3E] to-cyan-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectModal