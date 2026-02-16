'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';

interface Duck {
  id: number;
  x: number; // 0-1
  y: number; // 0-1
  vx: number; // velocity x
  vy: number; // velocity y
  state: 'flying' | 'shot' | 'escaping';
  type: 'green' | 'red' | 'blue';
  animFrame: number;
  spriteFrame: number; // 0-3 for wing animation
}

interface GameCanvasProps {
  score: number;
  round: number;
  aimX: number;
  aimY: number;
  onDuckHit: (id: number) => void;
  onDuckEscape: () => void;
  triggerShoot: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  speedMultiplier: number;
}

export default function GameCanvas({ score, round, aimX, aimY, onDuckHit, onDuckEscape, triggerShoot, difficulty, speedMultiplier }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ducksRef = useRef<Duck[]>([]);
  const lastTimeRef = useRef<number>(0);
  const [windowSize, setWindowSize] = useState({ w: 0, h: 0 });
  
  // Smooth cursor interpolation
  const smoothAimRef = useRef({ x: 0.5, y: 0.5 });
  
  // Image assets
  const duckSpriteRef = useRef<HTMLImageElement | null>(null);
  const crosshairSpriteRef = useRef<HTMLImageElement | null>(null);
  const backgroundRef = useRef<HTMLImageElement | null>(null);
  
  // Cache for processed duck sprites (performance optimization)
  const processedSpriteCache = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Load images with error handling and cleanup
  useEffect(() => {
    let mounted = true;
    
    const duckImg = new Image();
    duckImg.src = '/duck-sprite.png';
    duckImg.onload = () => { if (mounted) duckSpriteRef.current = duckImg; };
    duckImg.onerror = () => console.error('Failed to load duck sprite');

    const crosshairImg = new Image();
    crosshairImg.src = '/crosshair.png';
    crosshairImg.onload = () => { if (mounted) crosshairSpriteRef.current = crosshairImg; };
    crosshairImg.onerror = () => console.error('Failed to load crosshair sprite');

    const bgImg = new Image();
    bgImg.src = '/background.png';
    bgImg.onload = () => { if (mounted) backgroundRef.current = bgImg; };
    bgImg.onerror = () => console.error('Failed to load background');
    
    return () => {
      mounted = false;
      // Clear sprite cache on unmount
      processedSpriteCache.current.clear();
    };
  }, []);

  // Initialize Ducks
  useEffect(() => {
    if (ducksRef.current.length === 0) {
      spawnDuck();
    }
  }, [round]);

  const spawnDuck = () => {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const baseSpeed = 0.002 + round * 0.0003;
    ducksRef.current.push({
      id: Date.now(),
      x: side === 'left' ? 0.1 : 0.9,
      y: 0.6 + Math.random() * 0.2,
      vx: (side === 'left' ? 1 : -1) * baseSpeed * speedMultiplier,
      vy: (-0.003 - Math.random() * 0.003) * speedMultiplier,
      state: 'flying',
      type: 'green',
      animFrame: 0,
      spriteFrame: 0,
    });
  };

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Shoot Logic
  useEffect(() => {
    if (triggerShoot) {
      handleShoot();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerShoot]);

  // Memoize shoot handler to prevent recreations
  const handleShoot = useCallback(() => {
    const hitRadius = 0.08;
    const currentAimX = smoothAimRef.current.x;
    const currentAimY = smoothAimRef.current.y;
    
    let hitDetected = false;
    
    ducksRef.current.forEach(duck => {
      if (duck.state !== 'flying' || hitDetected) return;
      
      const dx = duck.x - currentAimX;
      const dy = duck.y - currentAimY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < hitRadius) {
        duck.state = 'shot';
        duck.vy = 0.015;
        duck.vx = 0;
        onDuckHit(score + 100);
        hitDetected = true;
        
        // Use requestAnimationFrame for confetti to avoid blocking
        requestAnimationFrame(() => {
          confetti({
            particleCount: 30,
            spread: 50,
            origin: { x: duck.x, y: duck.y },
            colors: ['#ff0000', '#ffffff', '#ffaa00']
          });
        });
      }
    });

    // Muzzle flash
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }, [score, onDuckHit]);

  // Game Loop
  useEffect(() => {
    let animationId: number;
    
    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      lastTimeRef.current = time;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Smooth cursor interpolation (lerp) - increased for smoother movement
      const lerpFactor = 0.25;
      smoothAimRef.current.x += (aimX - smoothAimRef.current.x) * lerpFactor;
      smoothAimRef.current.y += (aimY - smoothAimRef.current.y) * lerpFactor;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Modern Background
      if (backgroundRef.current) {
        ctx.drawImage(backgroundRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // Modern gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1e1b4b'); // deep purple
        gradient.addColorStop(0.5, '#7c3aed'); // vibrant purple
        gradient.addColorStop(1, '#0f172a'); // dark slate
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add floating particles effect
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        for (let i = 0; i < 50; i++) {
          const x = (Math.sin(time * 0.001 + i) * 0.5 + 0.5) * canvas.width;
          const y = (Math.cos(time * 0.0007 + i) * 0.5 + 0.5) * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Ducks
      ducksRef.current.forEach((duck, index) => {
        // Update Physics
        if (duck.state === 'flying') {
          duck.x += duck.vx;
          duck.y += duck.vy;
          
          // Bounce off walls
          if (duck.x <= 0.05 || duck.x >= 0.95) duck.vx *= -1;
          if (duck.y <= 0.1) duck.vy *= -1;
          
          duck.vy += 0.00005; // slight gravity
          
          // Animate wings (4 frames)
          duck.animFrame++;
          if (duck.animFrame % 8 === 0) {
            duck.spriteFrame = (duck.spriteFrame + 1) % 4;
          }

          if (duck.y > 1.0) {
            duck.state = 'escaping';
            onDuckEscape();
            ducksRef.current.splice(index, 1);
            spawnDuck();
          }

        } else if (duck.state === 'shot') {
          duck.y += duck.vy;
          duck.vy += 0.0008; // Gravity
          duck.spriteFrame = 2; // Falling frame
          
          if (duck.y > 1.2) {
            ducksRef.current.splice(index, 1);
            spawnDuck();
          }
        }

        // Render Duck Sprite - increased size for better visibility
        const dx = duck.x * canvas.width;
        const dy = duck.y * canvas.height;
        const duckSize = 120;

        if (duckSpriteRef.current) {
          // Sprite sheet has 4 frames in 2x2 grid
          const frameX = (duck.spriteFrame % 2) * 256;
          const frameY = Math.floor(duck.spriteFrame / 2) * 256;
          
          ctx.save();
          ctx.translate(dx, dy);
          if (duck.vx < 0) ctx.scale(-1, 1); // Flip horizontally
          
          // Create temporary canvas to remove white background
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 256;
          tempCanvas.height = 256;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            tempCtx.drawImage(
              duckSpriteRef.current,
              frameX, frameY, 256, 256,
              0, 0, 256, 256
            );
            
            // Remove white pixels
            const imageData = tempCtx.getImageData(0, 0, 256, 256);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              // If pixel is close to white, make it transparent
              if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
                data[i + 3] = 0; // Set alpha to 0
              }
            }
            tempCtx.putImageData(imageData, 0, 0);
            
            ctx.drawImage(
              tempCanvas,
              -duckSize/2, -duckSize/2, duckSize, duckSize
            );
          }
          
          ctx.restore();
        } else {
          // Fallback rectangle
          ctx.fillStyle = duck.state === 'shot' ? '#8B4513' : '#228B22';
          ctx.fillRect(dx - duckSize/2, dy - duckSize/2, duckSize, duckSize);
        }
      });

      // Draw Crosshair
      const cx = smoothAimRef.current.x * canvas.width;
      const cy = smoothAimRef.current.y * canvas.height;
      
      if (crosshairSpriteRef.current) {
        const crosshairSize = 60;
        ctx.drawImage(
          crosshairSpriteRef.current,
          cx - crosshairSize/2,
          cy - crosshairSize/2,
          crosshairSize,
          crosshairSize
        );
      } else {
        // Fallback crosshair
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 25, 0, Math.PI * 2);
        ctx.moveTo(cx - 35, cy);
        ctx.lineTo(cx + 35, cy);
        ctx.moveTo(cx, cy - 35);
        ctx.lineTo(cx, cy + 35);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aimX, aimY, round]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
