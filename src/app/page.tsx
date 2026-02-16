'use client';

import { useState, useEffect } from 'react';
import VisionController from '@/components/VisionController';
import GameCanvas from '@/components/GameCanvas';
import SnarkyDog from '@/components/SnarkyDog';

export default function Home() {
  // Game State
  const [aim, setAim] = useState({ x: 0.5, y: 0.5 });
  const [triggerShoot, setTriggerShoot] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [misses, setMisses] = useState(0);
  
  // Dog State
  const [dogVisible, setDogVisible] = useState(false);

  // Handlers
  const handleAim = (x: number, y: number) => {
    setAim({ x, y });
  };

  const handleShoot = () => {
    setTriggerShoot(prev => !prev); // Toggle to trigger effect
    // Check if shot was a miss? 
    // This logic is tricky because GameCanvas determines hit/miss.
    // Ideally, GameCanvas should callback (onMiss). 
    // For now, let's assume a "Miss" if score doesn't increase in 100ms? 
    // Hacky but simple for MVP: GameCanvas handles Hit, we handle "Shoot Event".
    
    // Simple cooldown for dog
    if (Math.random() > 0.7 && !dogVisible) {
        // 30% chance to mock on shot (might annoy, better on Miss but let's see)
        // Better: Wait for GameCanvas to tell us result.
    }
  };

  const handleDuckHit = (newScore: number) => {
    setScore(newScore);
    // Maybe Dog congratulates sarcastically?
  };

  const handleDuckEscape = () => {
    setMisses(m => m + 1);
    // Show dog on escape
    setDogVisible(true);
  };

  // Start Screen
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <main className="relative w-screen h-screen bg-sky-300 overflow-hidden cursor-none">
      
      {/* Background Scenery handled by CSS/Divs */}
      <div className="absolute bottom-0 w-full h-1/4 bg-green-600 z-10 border-t-8 border-green-800"></div>
      <div className="absolute bottom-20 left-20 w-32 h-32 bg-green-700 rounded-full z-0 opacity-50 blur-xl"></div>
      
      {/* UI HUD */}
      <div className="absolute top-4 right-4 z-40 bg-black/50 p-4 rounded-xl text-white font-mono border-2 border-white">
        <div className="text-2xl">SCORE: {score.toString().padStart(6, '0')}</div>
        <div className="text-xl text-yellow-400">ROUND: {round}</div>
        <div className="text-sm text-red-400">MISSES: {misses}</div>
      </div>

      {!gameStarted ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center text-white space-y-8 p-12 border-4 border-yellow-400 rounded-3xl bg-black">
            <h1 className="text-6xl font-black text-yellow-400 drop-shadow-[4px_4px_0_rgba(255,0,0,1)]">DUCK HUNT 2026</h1>
            <p className="text-xl">The Dog is watching. And judging.</p>
            <div className="space-y-2 text-gray-400">
               <p>👆 Pinch Index + Thumb to SHOOT</p>
               <p>👈 Move Hand to AIM</p>
            </div>
            <button 
                onClick={() => setGameStarted(true)}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-2xl rounded-full transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,0,0,0.5)]"
            >
              START GAME
            </button>
          </div>
        </div>
      ) : (
        <>
          <VisionController onAim={handleAim} onShoot={handleShoot} />
          <GameCanvas 
             score={score} 
             round={round} 
             aimX={aim.x} 
             aimY={aim.y} 
             onDuckHit={handleDuckHit} 
             onDuckEscape={handleDuckEscape}
             triggerShoot={triggerShoot}
          />
          <SnarkyDog 
            isVisible={dogVisible} 
            context={{ score, misses, round }} 
            onDismiss={() => setDogVisible(false)} 
          />
        </>
      )}
    </main>
  );
}
