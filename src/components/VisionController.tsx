'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';

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
    const mountedRef = useRef(true);
    const lastAimUpdateRef = useRef(0);
    const THROTTLE_MS = 16; // ~60fps throttle for aim updates

    useImperativeHandle(ref, () => ({
      start: async () => {
        await startCamera();
      },
      stop: () => {
        stopCamera();
      }
    }));

    const loadMediaPipeScripts = useCallback((): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (scriptsLoadedRef.current || window.Hands) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        script.crossOrigin = 'anonymous';
        script.integrity = ''; // Add SRI hash in production
        script.onload = () => {
          if (mountedRef.current) {
            scriptsLoadedRef.current = true;
            resolve();
          }
        };
        script.onerror = () => reject(new Error('Failed to load MediaPipe'));
        
        // Timeout for script loading
        const timeout = setTimeout(() => {
          reject(new Error('Script load timeout'));
        }, 10000);
        
        script.onload = () => {
          clearTimeout(timeout);
          if (mountedRef.current) {
            scriptsLoadedRef.current = true;
            resolve();
          }
        };
        
        document.head.appendChild(script);
      });
    }, []);

    const startCamera = useCallback(async () => {
      if (!mountedRef.current) return;
      
      try {
        // Request camera with constraints
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        
        if (videoRef.current && mountedRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          await videoRef.current.play();
          detectHands();
        } else {
          // Clean up if component unmounted during async operation
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (error) {
        console.error('❌ Camera access error:', error);
      }
    }, []);

    const stopCamera = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }, []);

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
        mountedRef.current = false;
        stopCamera();
        if (handsRef.current) {
          handsRef.current.close?.();
          handsRef.current = null;
        }
      };
      
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onResults = useCallback((results: any) => {
      if (!mountedRef.current || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

      const landmarks = results.multiHandLandmarks[0];
      
      // Index Finger Tip (Landmark 8) for Aim
      const indexTip = landmarks[8];
      
      // Validate landmark data
      if (!indexTip || typeof indexTip.x !== 'number' || typeof indexTip.y !== 'number') {
        return;
      }
      
      // Throttle aim updates for performance
      const now = Date.now();
      if (now - lastAimUpdateRef.current > THROTTLE_MS) {
        // Translate coordinates: Mirror effect (1 - x)
        // Clamp values to [0, 1] for security
        const aimX = Math.max(0, Math.min(1, 1 - indexTip.x));
        const aimY = Math.max(0, Math.min(1, indexTip.y));

        onAim(aimX, aimY);
        lastAimUpdateRef.current = now;
      }

      // Pinch detection: Thumb Tip (4) to Index Tip (8)
      const thumbTip = landmarks[4];
      
      if (!thumbTip || typeof thumbTip.x !== 'number' || typeof thumbTip.y !== 'number') {
        return;
      }
      
      const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
      
      // Threshold for pinch
      if (distance < 0.05) {
        if (now - lastShootTime.current > 300) { // Debounce 300ms
          onShoot();
          lastShootTime.current = now;
        }
      }
    }, [onAim, onShoot]);

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
