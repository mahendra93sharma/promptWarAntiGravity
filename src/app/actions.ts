'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateDogRoast(context: { score: number, misses: number, round: number, lang: string }) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not found, using fallback mocks.");
    return null; // Signal to use fallback
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are the Dog from Duck Hunt. But it's 2026, and you are a snarky, Gen-Z influenced critic.
      The player just finished a round or missed a shot.
      
      Context:
      - Score: ${context.score}
      - Misses: ${context.misses}
      - Round: ${context.round}
      - Language: ${context.lang} (English, Hindi, Haryanvi, or Rajasthani)

      Task:
      Generate a short, biting, funny, and slightly mean roast in the specified language (${context.lang}).
      If the language is Hindi/Haryanvi/Rajasthani, use Roman script mixed with English (Hinglish) or pure script if appropriate, but remember it will be read by a Text-to-Speech engine so Romanized is safer for pronunciation if the engine is generic. Actually, standard script is fine, I will handle TTS.
      
      Keep it under 20 words. Use slang. Be savage but funny.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}
