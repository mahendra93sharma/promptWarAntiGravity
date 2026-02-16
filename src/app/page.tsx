'use client';

import { useState, useRef, useEffect } from 'react';
import GameCanvas from '@/components/GameCanvas';
import VisionController, { VisionControllerHandle } from '@/components/VisionController';
import SnarkyDog from '@/components/SnarkyDog';
import { motion, AnimatePresence } from 'framer-motion';

type GameState = 'menu' | 'difficulty' | 'playing' | 'ended';
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG = {
  easy: {
    name: 'Easy',
    description: 'Slow ducks, relaxed gameplay',
    speedMultiplier: 0.6,
    maxRounds: 15,
    color: '#10b981', // green
  },
  medium: {
    name: 'Medium',
    description: 'Classic Duck Hunt experience',
    speedMultiplier: 1.0,
    maxRounds: 20,
    color: '#f59e0b', // orange
  },
  hard: {
    name: 'Hard',
    description: 'Fast ducks, expert mode',
    speedMultiplier: 1.5,
    maxRounds: 25,
    color: '#ef4444', // red
  },
};

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [misses, setMisses] = useState(0);
  const [aimX, setAimX] = useState(0.5);
  const [aimY, setAimY] = useState(0.5);
  const [shootTrigger, setShootTrigger] = useState(false);
  const [lastRoast, setLastRoast] = useState('');
  
  const visionRef = useRef<VisionControllerHandle>(null);
  const maxRounds = DIFFICULTY_CONFIG[difficulty].maxRounds;

  useEffect(() => {
    if (round > maxRounds && gameState === 'playing') {
      setGameState('ended');
      visionRef.current?.stop();
    }
  }, [round, maxRounds, gameState]);

  const handleAim = (x: number, y: number) => {
    setAimX(x);
    setAimY(y);
  };

  const handleShoot = () => {
    setShootTrigger(prev => !prev);
  };

  const handleDuckHit = (points: number) => {
    setScore(prev => prev + points);
    setRound(prev => prev + 1);
  };

  const handleDuckEscape = () => {
    setMisses(prev => prev + 1);
    setRound(prev => prev + 1);
  };

  const startGame = () => {
    setScore(0);
    setRound(1);
    setMisses(0);
    setGameState('playing');
    visionRef.current?.start();
  };

  const selectDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameState('difficulty');
  };

  const backToMenu = () => {
    setGameState('menu');
    visionRef.current?.stop();
  };

  const restartGame = () => {
    setScore(0);
    setRound(1);
    setMisses(0);
    setGameState('difficulty');
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0.3 
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Menu Screen */}
        {gameState === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-black/40 backdrop-blur-xl border-4 border-yellow-500 rounded-3xl p-12 max-w-2xl mx-4 shadow-2xl shadow-yellow-500/50">
              <motion.h1 
                className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4 text-center"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ backgroundSize: '200% 200%' }}
              >
                DUCK HUNT 2026
              </motion.h1>
              
              <p className="text-white text-xl text-center mb-8 font-light">
                The Dog is watching. And judging.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-white">
                  <span className="text-3xl">👆</span>
                  <span className="text-lg">Pinch Index + Thumb to SHOOT</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <span className="text-3xl">👉</span>
                  <span className="text-lg">Move Hand to AIM</span>
                </div>
              </div>

              <button
                onClick={() => setGameState('difficulty')}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-2xl font-bold py-6 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-red-500/50"
              >
                START GAME
              </button>
            </div>
          </motion.div>
        )}

        {/* Difficulty Selection */}
        {gameState === 'difficulty' && (
          <motion.div
            key="difficulty"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-black/40 backdrop-blur-xl border-4 border-cyan-500 rounded-3xl p-12 max-w-4xl mx-4 shadow-2xl shadow-cyan-500/50">
              <h2 className="text-5xl font-black text-cyan-400 mb-8 text-center">
                SELECT DIFFICULTY
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => {
                  const config = DIFFICULTY_CONFIG[diff];
                  return (
                    <motion.button
                      key={diff}
                      onClick={() => {
                        setDifficulty(diff);
                        startGame();
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative group"
                    >
                      <div 
                        className="bg-black/60 border-4 rounded-2xl p-8 transition-all"
                        style={{ 
                          borderColor: config.color,
                          boxShadow: `0 0 30px ${config.color}40`
                        }}
                      >
                        <h3 
                          className="text-4xl font-black mb-3"
                          style={{ color: config.color }}
                        >
                          {config.name.toUpperCase()}
                        </h3>
                        <p className="text-white text-sm mb-4">{config.description}</p>
                        <div className="text-gray-400 text-xs space-y-1">
                          <div>Speed: {config.speedMultiplier}x</div>
                          <div>Rounds: {config.maxRounds}</div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <button
                onClick={backToMenu}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xl font-bold py-4 px-8 rounded-xl transition-all"
              >
                BACK
              </button>
            </div>
          </motion.div>
        )}

        {/* Game Over Screen */}
        {gameState === 'ended' && (
          <motion.div
            key="ended"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-black/40 backdrop-blur-xl border-4 border-purple-500 rounded-3xl p-12 max-w-2xl mx-4 shadow-2xl shadow-purple-500/50">
              <h2 className="text-6xl font-black text-purple-400 mb-6 text-center">
                GAME OVER!
              </h2>
              
              <div className="bg-black/60 rounded-2xl p-8 mb-8">
                <div className="text-center space-y-4">
                  <div>
                    <div className="text-gray-400 text-sm">FINAL SCORE</div>
                    <div className="text-6xl font-black text-yellow-400">{score}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-gray-400 text-sm">HITS</div>
                      <div className="text-3xl font-bold text-green-400">{maxRounds - misses}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">MISSES</div>
                      <div className="text-3xl font-bold text-red-400">{misses}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">ACCURACY</div>
                    <div className="text-4xl font-bold text-cyan-400">
                      {Math.round(((maxRounds - misses) / maxRounds) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center text-white text-xl mb-8">
                {score >= maxRounds * 75 ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-black text-yellow-400"
                  >
                    🎉 LEGENDARY HUNTER! 🎉
                  </motion.div>
                ) : score >= maxRounds * 50 ? (
                  "Great shooting! Keep practicing!"
                ) : (
                  "The ducks lived to fly another day..."
                )}
              </div>

              <div className="space-y-4">
                <button
                  onClick={restartGame}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-2xl font-bold py-6 px-8 rounded-xl transition-all transform hover:scale-105"
                >
                  PLAY AGAIN
                </button>
                <button
                  onClick={backToMenu}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xl font-bold py-4 px-8 rounded-xl transition-all"
                >
                  MAIN MENU
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Canvas */}
      {gameState === 'playing' && (
        <>
          <GameCanvas
            score={score}
            round={round}
            aimX={aimX}
            aimY={aimY}
            onDuckHit={handleDuckHit}
            onDuckEscape={handleDuckEscape}
            triggerShoot={shootTrigger}
            difficulty={difficulty}
            speedMultiplier={DIFFICULTY_CONFIG[difficulty].speedMultiplier}
          />
          
          {/* HUD */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border-2 border-cyan-400 rounded-2xl p-6 shadow-lg shadow-cyan-400/50 z-40">
            <div className="text-white font-mono space-y-2">
              <div className="text-sm text-gray-400">SCORE:</div>
              <div className="text-4xl font-black text-yellow-400">{score.toString().padStart(6, '0')}</div>
              <div className="text-sm text-gray-400 mt-4">ROUND:</div>
              <div className="text-3xl font-bold text-cyan-400">{round}/{maxRounds}</div>
              <div className="text-sm text-gray-400 mt-4">MISSES:</div>
              <div className="text-3xl font-bold text-red-400">{misses}</div>
              <div className="text-xs text-gray-500 mt-4 uppercase">{DIFFICULTY_CONFIG[difficulty].name}</div>
            </div>
          </div>

          <VisionController ref={visionRef} onAim={handleAim} onShoot={handleShoot} />
          <SnarkyDog misses={misses} score={score} onRoast={setLastRoast} />
        </>
      )}
    </main>
  );
}
