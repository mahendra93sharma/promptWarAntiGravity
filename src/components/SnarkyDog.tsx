'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { generateDogRoast } from '@/app/actions';

// Mock Fallback
const getMockComment = (context: { score: number, misses: number, lang: string }) => {
  const mocks: Record<string, string[]> = {
    'en': ["My grandma aims better than that.", "You're shooting at clouds, genius.", "Did the duck pay you to miss?", "404: Aim Not Found."],
    'hi': ["Kya kar raha hai bhai?", "Nishana hai ya mazaak?", "Tujhse na ho payega beta.", "Ghar jaake Ludo khel."],
    'hr': ["Re bawli booch!", "Ke kar rahya se?", "Goli khaa lega ke?", "Tere bas ki naa se."],
    'rj': ["Kai kar ryo hai chora?", "Bhaaya kai nishano hai tharo?", "Mane lage thare bas ki koni.", "Paani pi le, thak gyo hola."]
  };
  
  const list = mocks[context.lang as keyof typeof mocks] || mocks['en'];
  return list[Math.floor(Math.random() * list.length)];
};

interface SnarkyDogProps {
  misses: number;
  score: number;
  onRoast: (message: string) => void;
}

export default function SnarkyDog({ misses, score, onRoast }: SnarkyDogProps) {
  const [message, setMessage] = useState<string>('');
  const [lang, setLang] = useState<string>('en');
  const [isVisible, setIsVisible] = useState(false);
  const lastMissesRef = useState(0);

  useEffect(() => {
    // Show dog when misses increase
    if (misses > lastMissesRef[0] && Math.random() > 0.3) {
      setIsVisible(true);
      
      // Pick random language
      const langs = ['en', 'hi', 'hr', 'rj'];
      const randomLang = langs[Math.floor(Math.random() * langs.length)];
      setLang(randomLang);

      const speak = (text: string, lang: string) => {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        if (lang === 'hi') utterance.lang = 'hi-IN';
        else utterance.lang = 'en-US';
        synth.speak(utterance);
      };

      // Try Gemini first, then fallback
      generateDogRoast({ score, misses, round: misses + score, lang: randomLang })
        .then(text => {
            const finalMessage = text || getMockComment({ score, misses, lang: randomLang });
            setMessage(finalMessage);
            onRoast(finalMessage);
            speak(finalMessage, randomLang);
        })
        .finally(() => {
            // Auto dismiss after 4s
            setTimeout(() => setIsVisible(false), 4000);
        });
    }
    
    lastMissesRef[0] = misses;
  }, [misses, score, onRoast, lastMissesRef]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="fixed bottom-0 left-1/2 transform -translate-x-1/2 mb-10 z-50 flex flex-col items-center"
        >
          {/* Dog Image (Pixel Art Style) */}
          <div className="w-48 h-48 bg-[url('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Vkd3B6Z2F5c3dkZ2F5c3Qza2F5c3dkZ2F5c3F6eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l41lFw057lAJQM3Dy/giphy.gif')] bg-no-repeat bg-contain bg-center drop-shadow-2xl"></div>
          
          {/* Speech Bubble */}
          <div className="relative bg-white border-4 border-black p-4 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm">
             <p className="text-xl font-bold font-mono text-black uppercase">{message}</p>
             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-black"></div>
             <div className="absolute -bottom-[14px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[16px] border-t-white"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
