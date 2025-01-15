import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useSpaces } from '../../core/spaces/SpaceProvider';
import { useMessages } from '../../core/messaging/MessageProvider';
import { SpacePatterns } from '../../core/spaces/SpacePatterns';

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.1;
  transition: opacity 0.3s ease;

  ${({ isActive }) => isActive && `
    opacity: 0.2;
  `}
`;

export function ConsciousnessField() {
  const canvasRef = useRef(null);
  const { currentSpace, energySubject } = useSpaces();
  const { systemResonance } = useMessages();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentSpace) return;

    const spacePattern = SpacePatterns[currentSpace.type];
    if (!spacePattern) return;

    const { 
      speed, 
      coherence, 
      maxConnections, 
      particleCount, 
      fadeRate 
    } = spacePattern.particleBehavior;

    const ctx = canvas.getContext('2d');
    const particles = [];
    let animationFrame;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.radius = Math.random() * 2 + 1;
        this.life = Math.random() * 0.5 + 0.5;
        
        // Space-specific behaviors
        if (currentSpace.type === 'Sanctuary') {
          // Calmer, more focused movement
          this.vx *= 0.7;
          this.vy *= 0.7;
        } else if (currentSpace.type === 'Workshop') {
          // More dynamic, energetic movement
          this.vx *= 1.3;
          this.vy *= 1.3;
        } else if (currentSpace.type === 'Garden') {
          // Natural, flowing movement
          this.vx = Math.sin(this.y / 50) * speed;
          this.vy = Math.cos(this.x / 50) * speed;
        }
      }

      update(energy) {
        this.x += this.vx * energy;
        this.y += this.vy * energy;
        this.life -= fadeRate;

        // Space-specific behaviors
        if (currentSpace.type === 'Library') {
          // Organized, grid-like movement
          this.x = Math.round(this.x / 20) * 20;
          this.y = Math.round(this.y / 20) * 20;
        } else if (currentSpace.type === 'Recovery') {
          // Gentle, circular movement
          const angle = Date.now() * 0.001;
          this.vx = Math.sin(angle) * speed * 0.5;
          this.vy = Math.cos(angle) * speed * 0.5;
        }

        if (this.life <= 0 || 
            this.x < 0 || this.x > canvas.width || 
            this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
      }

      draw(ctx, energy) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Space-specific colors
        let color;
        switch (currentSpace.type) {
          case 'Sanctuary':
            color = '99, 102, 241'; // Indigo
            break;
          case 'Workshop':
            color = '239, 68, 68'; // Red
            break;
          case 'Garden':
            color = '34, 197, 94'; // Green
            break;
          case 'Commons':
            color = '234, 179, 8'; // Yellow
            break;
          case 'Library':
            color = '147, 51, 234'; // Purple
            break;
          case 'Recovery':
            color = '14, 165, 233'; // Sky blue
            break;
          default:
            color = '99, 102, 241';
        }
        
        ctx.fillStyle = `rgba(${color}, ${this.life * energy})`;
        ctx.fill();
      }
    }

    const init = () => {
      resize();
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const drawConnections = (energy, resonance) => {
      const connectionThreshold = 100 * coherence * resonance;
      
      for (let i = 0; i < particles.length; i++) {
        const connections = [];
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionThreshold) {
            connections.push({
              particle: particles[j],
              distance
            });
          }
        }

        connections
          .sort((a, b) => a.distance - b.distance)
          .slice(0, maxConnections)
          .forEach(({ particle, distance }) => {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particle.x, particle.y);
            
            // Space-specific connection styles
            let color;
            switch (currentSpace.type) {
              case 'Sanctuary':
                color = '99, 102, 241';
                break;
              case 'Workshop':
                color = '239, 68, 68';
                break;
              case 'Garden':
                color = '34, 197, 94';
                break;
              case 'Commons':
                color = '234, 179, 8';
                break;
              case 'Library':
                color = '147, 51, 234';
                break;
              case 'Recovery':
                color = '14, 165, 233';
                break;
              default:
                color = '99, 102, 241';
            }
            
            ctx.strokeStyle = `rgba(${color}, ${
              (1 - distance / connectionThreshold) * energy * 0.2
            })`;
            ctx.stroke();
          });
      }
    };

    const animate = () => {
      const energy = currentSpace?.energy || 0;
      const resonance = systemResonance || 0;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update(energy);
        particle.draw(ctx, energy);
      });

      drawConnections(energy, resonance);
      
      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [currentSpace, systemResonance]);

  return (
    <Canvas 
      ref={canvasRef} 
      isActive={currentSpace?.energy > 0.7}
    />
  );
} 