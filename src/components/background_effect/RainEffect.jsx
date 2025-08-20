// components/RainEffect.js

import { useEffect, useRef, useState } from 'react';
import styles from './RainEffect.module.css';

const RainEffect = () => {
  const rainContainerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 }); // Center as default
  const rainDropsRef = useRef([]);
  
  useEffect(() => {
    const rainContainer = rainContainerRef.current;
    
    if (!rainContainer) {
      return;
    }
    
    const numberOfDrops = 80;

    // Function to create rain drops
    function createRainDrops() {
      // Clear existing drops first
      rainContainer.innerHTML = '';
      rainDropsRef.current = [];
      
      for (let i = 0; i < numberOfDrops; i++) {
        const drop = document.createElement('div');
        drop.classList.add(styles.drop);
        rainContainer.appendChild(drop);

        // Store drop data for mouse tracking
        const dropData = {
          element: drop,
          baseLeft: Math.random() * 110 - 5, // -5vw to 105vw 
          opacity: Math.random() * 0.6 + 0.2,
          duration: Math.random() * 2 + 1,
          delay: Math.random() * 4
        };
        
        rainDropsRef.current.push(dropData);

        // Initial positioning
        drop.style.left = `${dropData.baseLeft}vw`;
        drop.style.opacity = dropData.opacity;
        drop.style.animationDuration = `${dropData.duration}s`;
        drop.style.animationDelay = `${dropData.delay}s`;
      }
    }

    // Mouse tracking function using document instead of container to avoid blocking clicks
    let mouseTimer;
    function handleMouseMove(e) {
      clearTimeout(mouseTimer);
      mouseTimer = setTimeout(() => {
        // Use viewport coordinates instead of container coordinates
        const x = (e.clientX / window.innerWidth) * 100; // 0-100%
        const y = (e.clientY / window.innerHeight) * 100; // 0-100%
        setMousePosition({ x, y });
      }, 10);
    }

    // Add mouse move listener to document instead of container
    document.addEventListener('mousemove', handleMouseMove);

    // Initialize the rain
    createRainDrops();
    
    // Recreate drops periodically for continuous effect
    const intervalId = setInterval(createRainDrops, 8000);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Effect to update rain direction based on mouse position
  useEffect(() => {
    const rainDrops = rainDropsRef.current;
    
    rainDrops.forEach((dropData) => {
      if (dropData.element) {
        // Calculate wind effect based on mouse position
        const windStrength = 0.8; // Adjust wind intensity
        const centerX = 50; // Center of screen
        const windOffset = (mousePosition.x - centerX) * windStrength;
        
        // Apply CSS custom properties for wind effect
        const skewAngle = windOffset * 0.3; // Skew for wind effect
        const translateX = windOffset;
        
        dropData.element.style.setProperty('--wind-x', `${translateX}px`);
        dropData.element.style.setProperty('--wind-skew', `${skewAngle}deg`);
      }
    });
  }, [mousePosition]);

  return (
    <div>
      <div ref={rainContainerRef} className={styles.rain}></div>
    </div>
  );
};

export default RainEffect;
