import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../../core/navigation/useNavigation';

interface Path {
  nodes: string[];
  strength: number;
}

const Container = styled.div`
  position: relative;
  padding: 1rem;
`;

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
`;

const NextSteps = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Step = styled(motion.div)`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export const NavigationFlow: React.FC = () => {
  const navigation = useNavigation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paths, setPaths] = useState<Path[]>([]);
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [currentNode, setCurrentNode] = useState<string>('start');

  useEffect(() => {
    // Observe path changes
    const subscription = navigation.observePaths()
      .subscribe(newPaths => {
        setPaths(newPaths);
      });
      
    return () => subscription.unsubscribe();
  }, [navigation]);

  useEffect(() => {
    // Get natural next steps
    setNextSteps(navigation.getNextSteps(currentNode));
  }, [navigation, currentNode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Draw paths
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      paths.forEach(path => {
        drawPath(ctx, path, canvas);
      });
      
      requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [paths]);

  const drawPath = (ctx: CanvasRenderingContext2D, path: Path, canvas: HTMLCanvasElement) => {
    const points: { x: number; y: number }[] = [];
    const nodeCount = path.nodes.length;
    
    path.nodes.forEach((_, index) => {
      points.push({
        x: canvas.width * (index + 1) / (nodeCount + 1),
        y: canvas.height / 2 + Math.sin(index * Math.PI / 2) * 50
      });
    });

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i].x + points[i - 1].x) / 2;
      const yc = (points[i].y + points[i - 1].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${path.strength * 0.5})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  return (
    <Container>
      <Canvas ref={canvasRef} />
      
      <Content>
        <NextSteps>
          <AnimatePresence>
            {nextSteps.map(step => (
              <Step
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onClick={() => navigation.navigateTo(step)}
              >
                {step}
              </Step>
            ))}
          </AnimatePresence>
        </NextSteps>
      </Content>
    </Container>
  );
}; 