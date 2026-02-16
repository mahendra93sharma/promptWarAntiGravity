'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface VisionControllerProps {
  onAim: (x: number, y: number) => void;
  onShoot: () => void;
}

export type VisionControllerHandle = {
  start: () => void;
  stop: () => void;
};

// TypeScript declarations for MediaPipe loaded via CDN
declare global {
  interface Window {
    Hands: any;
  }
}

const VisionController = forwardRef<VisionControllerHandle, VisionControllerProps>(
  ({ onAim, onShoot }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastShootTime = useRef(0);
    const handsRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const scriptsLoadedRef = useRef(false);

    useImperativeHandle(ref, () => ({
      start: async () => {
        await startCamera();
      },
      stop: () => {
        stopCamera();
      }
    }));

    const loadMediaPipeScripts = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (scriptsLoadedRef.current || window.Hands) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          scriptsLoadedRef.current = true;
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load MediaPipe'));
        document.head.appendChild(script);
      });
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          await videoRef.current.play();
          detectHands();
        }
      } catch (error) {
        console.error('Camera access error:', error);
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };

    const detectHands = async () => {
      if (!videoRef.current || !canvasRef.current || !handsRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      await handsRef.current.send({ image: canvas });
      
      animationRef.current = requestAnimationFrame(detectHands);
    };

    useEffect(() => {
      const initializeHands = async () => {
        try {
          await loadMediaPipeScripts();
          
          const hands = new window.Hands({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            },
          });

          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7,
          });

          hands.onResults(onResults);
          handsRef.current = hands;

          await startCamera();
        } catch (error) {
          console.error('Failed to initialize hands:', error);
        }
      };

      initializeHands();

      return () => {
        stopCamera();
      };
      
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onResults = (results: any) => {
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

      const landmarks = results.multiHandLandmarks[0];
      
      // Index Finger Tip (Landmark 8) for Aim
      const indexTip = landmarks[8];
      
      // Translate coordinates: Mirror effect (1 - x)
      const aimX = 1 - indexTip.x; 
      const aimY = indexTip.y;

      onAim(aimX, aimY);

      // Pinch detection: Thumb Tip (4) to Index Tip (8)
      const thumbTip = landmarks[4];
      const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
      
      // Threshold for pinch
      if (distance < 0.05) {
        const now = Date.now();
        if (now - lastShootTime.current > 300) { // Debounce 300ms
          onShoot();
          lastShootTime.current = now;
        }
      }
    };

    return (
      <div className="fixed top-4 left-4 z-50 opacity-50 hover:opacity-100 transition-opacity">
        <video
          ref={videoRef}
          className="w-32 h-24 bg-black rounded border border-green-500 transform scale-x-[-1]"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="text-xs text-green-500 text-center mt-1 font-mono">VISION: ACTIVE</div>
      </div>
    );
  }
);

VisionController.displayName = "VisionController";
export default VisionController;
