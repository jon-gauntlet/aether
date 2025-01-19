import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

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

export function ConsciousnessField({ messages = [] }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    let animationFrame;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    // Initialize canvas size
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor(message) {
        this.message = message;
        this.reset();
      }

      reset() {
        // Position particle near its message
        const messageEl = document.querySelector(`[data-message-id="${this.message.id}"]`);
        if (messageEl) {
          const rect = messageEl.getBoundingClientRect();
          this.x = rect.left + rect.width / 2;
          this.y = rect.top + rect.height / 2;
        } else {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
        }

        // Velocity based on RAG context strength
        const contextStrength = this.message.ragContext?.score || 0;
        this.vx = (Math.random() - 0.5) * contextStrength * 2;
        this.vy = (Math.random() - 0.5) * contextStrength * 2;
        
        this.radius = Math.random() * 2 + 1;
        this.life = Math.random() * 0.5 + 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.01;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        if (this.life <= 0) {
          this.reset();
        }
      }

      draw(ctx) {
        const contextStrength = this.message.ragContext?.score || 0;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(66, 153, 225, ${contextStrength * this.life})`;
        ctx.fill();
      }
    }

    // Create particles for messages with RAG context
    messages.forEach(message => {
      if (message.ragContext) {
        particles.push(new Particle(message));
      }
    });

    // Draw connections between related messages
    function drawConnections(ctx) {
      messages.forEach(message => {
        if (!message.ragContext) return;

        const sourceEl = document.querySelector(`[data-message-id="${message.id}"]`);
        if (!sourceEl) return;

        const sourceRect = sourceEl.getBoundingClientRect();
        const sourceX = sourceRect.left + sourceRect.width / 2;
        const sourceY = sourceRect.top + sourceRect.height / 2;

        // Find related messages based on RAG context
        messages.forEach(otherMessage => {
          if (message === otherMessage || !otherMessage.ragContext) return;

          const similarity = calculateSimilarity(message.ragContext, otherMessage.ragContext);
          if (similarity < 0.5) return;

          const targetEl = document.querySelector(`[data-message-id="${otherMessage.id}"]`);
          if (!targetEl) return;

          const targetRect = targetEl.getBoundingClientRect();
          const targetX = targetRect.left + targetRect.width / 2;
          const targetY = targetRect.top + targetRect.height / 2;

          ctx.beginPath();
          ctx.moveTo(sourceX, sourceY);
          ctx.lineTo(targetX, targetY);
          ctx.strokeStyle = `rgba(66, 153, 225, ${similarity * 0.2})`;
          ctx.stroke();
        });
      });
    }

    function calculateSimilarity(context1, context2) {
      // Simple similarity based on context scores
      // In a real implementation, you'd use vector similarity
      return Math.min(context1.score, context2.score);
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      drawConnections(ctx);
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });

      animationFrame = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [messages]);

  return <Canvas ref={canvasRef} />;
} 