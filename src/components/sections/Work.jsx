import React, { useState } from 'react'
import ParticleBackground from '../effects/ParticleBackground'
import ShinyText from '../effects/ShinyText'
import ProjectModal from '../ui/ProjectModal'
import { useTheme } from '../../contexts/ThemeContext'

const Work = () => {
  const [selectedProject, setSelectedProject] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { colors, isDarkMode } = useTheme()

  const handleProjectClick = (project) => {
    setSelectedProject(project)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProject(null)
  }
  const projects = [
    {
      title: "Skip",
      image: "/api/placeholder/400/300",
      description: "Modern fintech platform"
    },
    {
      title: "Payload",
      image: "/api/placeholder/400/300", 
      description: "Content management system"
    }
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{background: colors.background}}>
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Large Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-75">
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
          className="text-[20vw] dm-serif-text-regular tracking-tight leading-none select-none uppercase"
        >
          work
        </ShinyText>
      </div>
      
      {/* Content */}
      <div className="relative w-full max-w-6xl mx-auto px-6 py-20" style={{ zIndex: 10 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {projects.map((project, index) => (
            <div key={index} className="group relative">
              {/* Gradient Border Card */}
              <div className="relative p-1.5 rounded-3xl bg-gradient-to-br from-[#A9CC3E] via-cyan-400 to-purple-500 hover:from-purple-500 hover:via-cyan-400 hover:to-[#A9CC3E] transition-all duration-500 transform hover:scale-105">
                <div className="relative rounded-3xl p-11 h-[550px] flex flex-col justify-between overflow-hidden" style={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff'
                }}>
                  {/* Project Image Area */}
                  <div className="flex-1 flex items-center justify-center mb-8">
                    <div className="w-48 h-48 rounded-full flex items-center justify-center" style={{
                      backgroundColor: isDarkMode ? '#2a2a2a' : '#f3f4f6'
                    }}>
                      <span className="text-lg" style={{
                        color: isDarkMode ? '#888888' : '#6b7280'
                      }}>Image</span>
                    </div>
                  </div>
                  
                  {/* Project Title */}
                  <div className="mb-8">
                    <h3 className="text-6xl md:text-7xl font-black dm-serif-text-regular tracking-tight" style={{
                      color: isDarkMode ? colors.text : '#000000'
                    }}>
                      {project.title}
                    </h3>
                  </div>
                  
                  {/* Explore Button */}
                  <div className="flex justify-start">
                    <button 
                      className="explore-button group-hover:scale-110 transition-transform duration-300"
                      onClick={() => handleProjectClick(project)}
                    >
                      <span className="explore-button_lg">
                        <span className="explore-button_sl" />
                        <span className="explore-button_text">📱 Explore project</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={selectedProject}
      />

      {/* CSS for Explore Button */}
      <style jsx>{`
        .explore-button {
          -moz-appearance: none;
          -webkit-appearance: none;
          appearance: none;
          border: none;
          background: none;
          color: #0f1923;
          cursor: pointer;
          position: relative;
          padding: 4px;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 14px;
          transition: all .15s ease;
        }

        .explore-button::before,
        .explore-button::after {
          content: '';
          display: block;
          position: absolute;
          right: 0;
          left: 0;
          height: calc(50% - 5px);
          border: 1px solid #7D8082;
          transition: all .15s ease;
        }

        .explore-button::before {
          top: 0;
          border-bottom-width: 0;
        }

        .explore-button::after {
          bottom: 0;
          border-top-width: 0;
        }

        .explore-button:active,
        .explore-button:focus {
          outline: none;
        }

        .explore-button:active::before,
        .explore-button:active::after {
          right: 3px;
          left: 3px;
        }

        .explore-button:active::before {
          top: 3px;
        }

        .explore-button:active::after {
          bottom: 3px;
        }

        .explore-button_lg {
          position: relative;
          display: block;
          padding: 12px 20px;
          color: #fff;
          background-color: ${isDarkMode ? '#0f1923' : '#131515'};
          overflow: hidden;
          box-shadow: inset 0px 0px 0px 1px transparent;
        }

        .explore-button_lg::before {
          content: '';
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: 2px;
          height: 2px;
          background-color: ${isDarkMode ? '#0f1923' : '#131515'};
        }

        .explore-button_lg::after {
          content: '';
          display: block;
          position: absolute;
          right: 0;
          bottom: 0;
          width: 4px;
          height: 4px;
          background-color: ${isDarkMode ? '#0f1923' : '#131515'};
          transition: all .2s ease;
        }

        .explore-button_sl {
          display: block;
          position: absolute;
          top: 0;
          bottom: -1px;
          left: -8px;
          width: 0;
          background-color: #A9CC3E;
          transform: skew(-15deg);
          transition: all .2s ease;
        }

        .explore-button_text {
          position: relative;
        }

        .explore-button:hover {
          color: #0f1923;
        }

        .explore-button:hover .explore-button_sl {
          width: calc(100% + 15px);
        }

        .explore-button:hover .explore-button_lg::after {
          background-color: #fff;
        }
      `}</style>
    </section>
  )
}

export default Work