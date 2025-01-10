import React, { useEffect, useState, useRef } from 'react';
import { NaturalNavigation } from '../../core/experience/NaturalNavigation';

interface NavigationFlowProps {
  navigation: NaturalNavigation;
  currentNode: string;
}

interface Point {
  x: number;
  y: number;
}

export const NavigationFlow: React.FC<NavigationFlowProps> = ({
  navigation,
  currentNode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paths, setPaths] = useState<any[]>([]);
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  
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

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw natural paths
    paths.forEach(path => {
      if (path.nodes.includes(currentNode)) {
        drawPath(ctx, path);
      }
    });
  }, [paths, currentNode]);

  // Draw natural flowing path
  const drawPath = (
    ctx: CanvasRenderingContext2D,
    path: any
  ) => {
    const points = generatePoints(path);
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    // Natural curve through points
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    // Connect to last point
    const last = points[points.length - 1];
    const secondLast = points[points.length - 2];
    ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);

    // Natural flow styling
    ctx.strokeStyle = `rgba(255,255,255,${path.strength})`;
    ctx.lineWidth = 2 + path.strength * 3;
    ctx.stroke();

    // Energy glow
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 10 * path.strength;
  };

  // Generate natural point distribution
  const generatePoints = (path: any): Point[] => {
    const canvas = canvasRef.current;
    if (!canvas) return [];

    const points: Point[] = [];
    const nodeCount = path.nodes.length;
    
    path.nodes.forEach((_, index) => {
      points.push({
        x: canvas.width * (index + 1) / (nodeCount + 1),
        y: canvas.height / 2 + Math.sin(index * Math.PI / 2) * 50
      });
    });

    return points;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Natural next steps */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        gap: '10px'
      }}>
        {nextSteps.map(step => (
          <div
            key={step}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => navigation.navigateTo(step)}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}; 