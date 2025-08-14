import React from 'react'
import ParticleBackground from './ParticleBackground'

const ScrollRevealSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background - Same as Hero */}
      <div className="absolute inset-0" style={{background: "radial-gradient(circle at center, #1a1a1a 0%, #131515 100%)"}}></div>
      
      {/* Particle Background - Same as Hero */}
      <ParticleBackground />
      
      {/* Additional Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent bg-repeat" 
             style={{backgroundImage: "radial-gradient(circle at 2px 2px, rgba(156, 146, 172, 0.1) 1px, transparent 0)", backgroundSize: "60px 60px"}}></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-6 py-32">
        {/* Main Title Section */}
        <div className="text-center mb-32 scroll-reveal-item" data-delay="100">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-8 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Next Level
            </span>
            <br />
            <span className="text-white">Experience</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
            Where innovation meets perfection. Discover technology that transforms possibilities into reality.
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Features Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">
          {/* Left Side - Large Feature */}
          <div className="scroll-reveal-item" data-delay="200">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-12 hover:bg-white/10 transition-all duration-500">
                <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-4xl font-bold text-white mb-6">Revolutionary Speed</h3>
                <p className="text-xl text-gray-300 leading-relaxed mb-8">
                  Experience lightning-fast performance that redefines what's possible. Our cutting-edge technology delivers results at the speed of thought.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse" style={{width: '95%'}}></div>
                  </div>
                  <span className="text-cyan-400 font-bold text-lg">95%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Two Smaller Features */}
          <div className="space-y-8">
            <div className="scroll-reveal-item" data-delay="300">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:-translate-y-2 transition-all duration-500">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">Smart Innovation</h4>
                <p className="text-gray-300 leading-relaxed">
                  AI-powered solutions that learn and adapt to deliver personalized experiences beyond imagination.
                </p>
              </div>
            </div>

            <div className="scroll-reveal-item" data-delay="400">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:-translate-y-2 transition-all duration-500">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">Perfect Design</h4>
                <p className="text-gray-300 leading-relaxed">
                  Every pixel crafted with precision. Beautiful interfaces that feel intuitive and delightful to use.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="scroll-reveal-item" data-delay="500">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-12 mb-32">
            <div className="text-center mb-12">
              <h3 className="text-4xl font-bold text-white mb-4">Numbers That Speak</h3>
              <p className="text-xl text-gray-300">Real results from real innovation</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="scroll-reveal-item" data-delay="600">
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                  1M+
                </div>
                <div className="text-gray-300 text-lg">Active Users</div>
              </div>
              <div className="scroll-reveal-item" data-delay="700">
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
                  50K+
                </div>
                <div className="text-gray-300 text-lg">Projects Done</div>
              </div>
              <div className="scroll-reveal-item" data-delay="800">
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
                  99.9%
                </div>
                <div className="text-gray-300 text-lg">Uptime</div>
              </div>
              <div className="scroll-reveal-item" data-delay="900">
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-2">
                  24/7
                </div>
                <div className="text-gray-300 text-lg">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center scroll-reveal-item" data-delay="1000">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8">
            Ready to 
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Transform</span>?
          </h2>
          <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Join thousands who have already discovered the future of technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="group relative px-12 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-full hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25 text-xl">
              <span className="relative z-10">Start Your Journey</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button className="px-12 py-6 border-2 border-white/20 text-white font-semibold rounded-full hover:bg-white/10 hover:border-cyan-400/50 transition-all duration-300 backdrop-blur-sm text-xl">
              Explore Features
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ScrollRevealSection