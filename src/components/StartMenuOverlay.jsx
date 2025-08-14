import React, { useState, useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import ParticleBackground from './ParticleBackground';
import AuroraTextEffect from './AuroraTextEffect';

const StartMenuOverlay = ({
  items = [],
  isOpen = false,
  onClose,
  buttonPosition = { left: "90%", top: "24px" },
  overlayBackground = "#131515",
  textColor = "#ffffff",
  fontSize = "lg",
  fontFamily = '"Press Start 2P", system-ui',
  fontWeight = "normal",
  animationDuration = 1.5,
  staggerDelay = 0.1,
  menuAlignment = "center",
  className,
  menuItemClassName,
  keepOpenOnItemClick = false,
  ariaLabel = "Start menu",
  onOpen,
  menuDirection = "vertical",
  enableBlur = false,
  zIndex = 1000,
}) => {
  const navRef = useRef(null);
  const containerRef = useRef(null);

  const fontSizes = {
    sm: "text-2xl md:text-3xl",
    md: "text-3xl md:text-4xl",
    lg: "text-4xl md:text-5xl",
    xl: "text-5xl md:text-6xl",
    "2xl": "text-6xl md:text-7xl",
  };

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }

    if (item.href && !item.onClick) {
      window.location.href = item.href;
    }

    if (!keepOpenOnItemClick) {
      onClose?.();
    }
  };

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Call onOpen when menu opens
  useEffect(() => {
    if (isOpen) {
      onOpen?.();
    }
  }, [isOpen, onOpen]);

  if (!isOpen) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full" style={{zIndex: 50000, background: overlayBackground}}>
      <style jsx>{`
        .start-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: ${overlayBackground};
          clip-path: circle(0px at ${buttonPosition.left} ${buttonPosition.top});
          animation: expandOverlay ${animationDuration}s ease-out forwards;
        }
        
        @keyframes expandOverlay {
          to {
            clip-path: circle(150% at ${buttonPosition.left} ${buttonPosition.top});
          }
        }
        
        @keyframes fadeInContent {
          to {
            opacity: 1;
          }
        }
        
        /* Send Message Button Styles */
        .send-button {
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
          font-size: 16px;
          transition: all .15s ease;
          width: 100%;
        }

        .send-button::before,
        .send-button::after {
          content: '';
          display: block;
          position: absolute;
          right: 0;
          left: 0;
          height: calc(50% - 5px);
          border: 1px solid #7D8082;
          transition: all .15s ease;
        }

        .send-button::before {
          top: 0;
          border-bottom-width: 0;
        }

        .send-button::after {
          bottom: 0;
          border-top-width: 0;
        }

        .send-button:active,
        .send-button:focus {
          outline: none;
        }

        .send-button:active::before,
        .send-button:active::after {
          right: 3px;
          left: 3px;
        }

        .send-button:active::before {
          top: 3px;
        }

        .send-button:active::after {
          bottom: 3px;
        }

        .send-button_lg {
          position: relative;
          display: block;
          padding: 15px 30px;
          color: #fff;
          background-color: #0f1923;
          overflow: hidden;
          box-shadow: inset 0px 0px 0px 1px transparent;
        }

        .send-button_lg::before {
          content: '';
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: 2px;
          height: 2px;
          background-color: #0f1923;
        }

        .send-button_lg::after {
          content: '';
          display: block;
          position: absolute;
          right: 0;
          bottom: 0;
          width: 4px;
          height: 4px;
          background-color: #0f1923;
          transition: all .2s ease;
        }

        .send-button_sl {
          display: block;
          position: absolute;
          top: 0;
          bottom: -1px;
          left: -8px;
          width: 0;
          background-color: #22d3ee;
          transform: skew(-15deg);
          transition: all .2s ease;
        }

        .send-button_text {
          position: relative;
        }

        .send-button:hover {
          color: #0f1923;
        }

        .send-button:hover .send-button_sl {
          width: calc(100% + 15px);
        }

        .send-button:hover .send-button_lg::after {
          background-color: #fff;
        }
        
        /* Close Button Styles */
        .close-button {
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
          font-size: 20px;
          transition: all .15s ease;
        }

        .close-button::before,
        .close-button::after {
          content: '';
          display: block;
          position: absolute;
          right: 0;
          left: 0;
          height: calc(50% - 5px);
          border: 1px solid #7D8082;
          transition: all .15s ease;
        }

        .close-button::before {
          top: 0;
          border-bottom-width: 0;
        }

        .close-button::after {
          bottom: 0;
          border-top-width: 0;
        }

        .close-button:active,
        .close-button:focus {
          outline: none;
        }

        .close-button:active::before,
        .close-button:active::after {
          right: 3px;
          left: 3px;
        }

        .close-button:active::before {
          top: 3px;
        }

        .close-button:active::after {
          bottom: 3px;
        }

        .close-button_lg {
          position: relative;
          display: block;
          padding: 12px 16px;
          color: #fff;
          background-color: #0f1923;
          overflow: hidden;
          box-shadow: inset 0px 0px 0px 1px transparent;
        }

        .close-button_lg::before {
          content: '';
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: 2px;
          height: 2px;
          background-color: #0f1923;
        }

        .close-button_lg::after {
          content: '';
          display: block;
          position: absolute;
          right: 0;
          bottom: 0;
          width: 4px;
          height: 4px;
          background-color: #0f1923;
          transition: all .2s ease;
        }

        .close-button_sl {
          display: block;
          position: absolute;
          top: 0;
          bottom: -1px;
          left: -8px;
          width: 0;
          background-color: #ef4444;
          transform: skew(-15deg);
          transition: all .2s ease;
        }

        .close-button_text {
          position: relative;
          font-size: 24px;
          line-height: 1;
        }

        .close-button:hover {
          color: #0f1923;
        }

        .close-button:hover .close-button_sl {
          width: calc(100% + 15px);
        }

        .close-button:hover .close-button_lg::after {
          background-color: #fff;
        }
        
        .menu-items-${zIndex} {
          ${menuDirection === "horizontal" ? "display: flex; flex-wrap: wrap; gap: 2rem;" : ""}
          ${menuAlignment === "center" ? "text-align: center;" : ""}
          ${menuAlignment === "right" ? "text-align: right;" : ""}
          padding: 2rem;
        }
        
        .menu-item-${zIndex} {
          position: relative;
          list-style: none;
          padding: 1rem 0;
          cursor: pointer;
          transform: translateY(50px);
          opacity: 0;
          transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          font-family: ${fontFamily};
          font-weight: ${fontWeight};
          color: ${textColor};
          ${menuDirection === "horizontal" ? "display: inline-block; margin: 0 1rem;" : ""}
          animation: slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        @keyframes slideInUp {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .menu-item-${zIndex}:nth-child(1) { animation-delay: 0.2s; }
        .menu-item-${zIndex}:nth-child(2) { animation-delay: 0.3s; }
        .menu-item-${zIndex}:nth-child(3) { animation-delay: 0.4s; }
        .menu-item-${zIndex}:nth-child(4) { animation-delay: 0.5s; }
        .menu-item-${zIndex}:nth-child(5) { animation-delay: 0.6s; }
        .menu-item-${zIndex}:nth-child(6) { animation-delay: 0.7s; }
        
        .menu-item-${zIndex}::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) scaleX(0);
          width: 120%;
          height: 2px;
          border-radius: 10px;
          background: linear-gradient(90deg, #22d3ee, #6366f1, #a855f7);
          transition: all 0.3s ease;
          pointer-events: none;
        }
        
        .menu-item-${zIndex}:hover::before {
          transform: translate(-50%, -50%) scaleX(1);
        }
        
        .menu-item-${zIndex} span {
          opacity: 0.8;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(45deg, #ffffff, #22d3ee, #a855f7);
          background-size: 300% 300%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .menu-item-${zIndex}:hover span {
          opacity: 1;
          transform: scale(1.1);
        }
        
        .menu-item-${zIndex}:focus {
          outline: 2px solid #22d3ee;
          outline-offset: 4px;
          border-radius: 8px;
        }
        
        .menu-title {
          font-size: 1.5rem;
          margin-bottom: 2rem;
          background: linear-gradient(45deg, #22d3ee, #6366f1, #a855f7);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
        }
        
        /* Enhanced Mobile responsiveness */
        @media (max-width: 1024px) {
          .start-overlay {
            clip-path: circle(0px at 50% 30px);
            animation: expandOverlayMobile ${animationDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
          
          @keyframes expandOverlayMobile {
            to {
              clip-path: circle(150% at 50% 30px);
            }
          }
        }
        
        @media (max-width: 768px) {
          .close-button_lg {
            padding: 8px 12px;
          }
          
          .close-button_text {
            font-size: 20px;
          }
          
          .send-button_lg {
            padding: 12px 20px;
            font-size: 14px;
          }
        }
        
        @media (max-width: 640px) {
          .send-button {
            font-size: 12px;
          }
          
          .send-button_lg {
            padding: 10px 16px;
          }
          
          .close-button {
            font-size: 16px;
          }
          
          .close-button_lg {
            padding: 6px 10px;
          }
        }
        
        /* Ultra-mobile optimizations */
        @media (max-width: 480px) {
          .start-overlay {
            clip-path: circle(0px at 50% 20px);
          }
          
          @keyframes expandOverlayMobile {
            to {
              clip-path: circle(200% at 50% 20px);
            }
          }
        }
      `}</style>

      {/* Navigation Overlay */}
      <div
        ref={navRef}
        className="start-overlay"
        aria-hidden={!isOpen}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <ParticleBackground />
        </div>

        {/* Start Now Style Close Button */}
        <div className="close-button-wrapper absolute top-4 lg:top-8 right-4 lg:right-8 z-50">
          <button className="close-button" onClick={onClose}>
            <span className="close-button_lg">
              <span className="close-button_sl" />
              <span className="close-button_text">×</span>
            </span>
          </button>
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full h-full flex flex-col lg:flex-row" style={{opacity: 0, animation: `fadeInContent 0.8s ease-out 0.5s forwards`}}>
          {/* Left Side - Navigation */}
          <div className="w-full lg:w-3/5 h-auto lg:h-full flex flex-col justify-start pt-16 lg:pt-32 px-6 lg:pl-20 lg:pr-8">
            <div className="space-y-4 lg:space-y-6 lg:ml-16">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  className="navigation-button block text-left group relative overflow-hidden w-full"
                >
                  {/* Default text visible when not hovering */}
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-600 group-hover:text-white transition-all duration-500 dm-serif-text-regular tracking-tight leading-tight uppercase">
                    {item.label}
                  </h2>
                  
                  {/* Simple gradient text overlay on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black dm-serif-text-regular tracking-tight leading-tight uppercase bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {item.label}
                    </h2>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="w-full lg:w-2/5 h-auto lg:h-full flex flex-col justify-center px-6 lg:px-12 py-8 lg:py-0 relative">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-cyan-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            
            <div className="max-w-xl relative z-10 w-full">
              {/* Header Section */}
              <div className="mb-6 lg:mb-8 relative">
                <div className="relative">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white dm-serif-text-regular mb-3 lg:mb-4 leading-tight tracking-wide">
                    let's get started
                  </h2>
                  <div className="w-12 lg:w-16 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 mb-3 lg:mb-4 rounded-full"></div>
                  <p className="text-gray-300 dm-serif-text-regular text-sm lg:text-base leading-relaxed font-light">
                    Let's team up to delight your customers and accelerate your business!
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="space-y-3 lg:space-y-4">
                {/* First Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2 dm-serif-text-regular uppercase tracking-[0.2em]">
                      Your Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg px-3 lg:px-4 py-2 lg:py-3 text-white dm-serif-text-regular text-sm lg:text-base focus:outline-none focus:border-cyan-400/60 transition-colors duration-300 placeholder-gray-500"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2 dm-serif-text-regular uppercase tracking-[0.2em]">
                      Your Email
                    </label>
                    <input
                      type="email"
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg px-3 lg:px-4 py-2 lg:py-3 text-white dm-serif-text-regular text-sm lg:text-base focus:outline-none focus:border-cyan-400/60 transition-colors duration-300 placeholder-gray-500"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2 dm-serif-text-regular uppercase tracking-[0.2em]">
                      Company Website
                    </label>
                    <input
                      type="url"
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg px-3 lg:px-4 py-2 lg:py-3 text-white dm-serif-text-regular text-sm lg:text-base focus:outline-none focus:border-cyan-400/60 transition-colors duration-300 placeholder-gray-500"
                      placeholder="www.yourcompany.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2 dm-serif-text-regular uppercase tracking-[0.2em]">
                      Budget (USD)
                    </label>
                    <div className="relative">
                      <select className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg px-3 lg:px-4 py-2 lg:py-3 text-white dm-serif-text-regular text-sm lg:text-base focus:outline-none focus:border-cyan-400/60 transition-colors duration-300 appearance-none cursor-pointer">
                        <option value="" className="bg-gray-900">Select budget range</option>
                        <option value="5k-10k" className="bg-gray-900">$5k - $10k</option>
                        <option value="10k-25k" className="bg-gray-900">$10k - $25k</option>
                        <option value="25k-50k" className="bg-gray-900">$25k - $50k</option>
                        <option value="50k-100k" className="bg-gray-900">$50k - $100k</option>
                        <option value="100k+" className="bg-gray-900">$100k+</option>
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vision Textarea */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 dm-serif-text-regular uppercase tracking-[0.2em]">
                    What's your vision for this project?
                  </label>
                  <textarea
                    rows="3"
                    className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg px-3 lg:px-4 py-2 lg:py-3 text-white dm-serif-text-regular text-sm lg:text-base focus:outline-none focus:border-cyan-400/60 transition-colors duration-300 resize-none placeholder-gray-500"
                    placeholder="Tell us about your project goals..."
                  ></textarea>
                </div>

                {/* Submit Button */}
                <div className="pt-3 lg:pt-4">
                  <button className="send-button w-full" onClick={() => { onClose?.(); }}>
                    <span className="send-button_lg">
                      <span className="send-button_sl" />
                      <span className="send-button_text">Send Message</span>
                    </span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartMenuOverlay;