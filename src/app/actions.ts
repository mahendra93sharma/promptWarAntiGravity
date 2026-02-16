'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

// Validate API key exists
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not configured. AI features will use fallback responses.');
}

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
  : null;

// Rate limiting: Simple in-memory cache (for production, use Redis)
const requestCache = new Map<string, { timestamp: number; count: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// Input validation schema
const VALID_LANGUAGES = ['en', 'hi', 'hr', 'rj'] as const;
type ValidLanguage = typeof VALID_LANGUAGES[number];

interface RoastContext {
  score: number;
  misses: number;
  round: number;
  lang: string;
}

function isValidLanguage(lang: string): lang is ValidLanguage {
  return VALID_LANGUAGES.includes(lang as ValidLanguage);
}

function validateContext(context: RoastContext): { valid: boolean; error?: string } {
  // Input validation
  if (typeof context.score !== 'number' || context.score < 0 || context.score > 1000000) {
    return { valid: false, error: 'Invalid score value' };
  }
  
  if (typeof context.misses !== 'number' || context.misses < 0 || context.misses > 1000) {
    return { valid: false, error: 'Invalid misses value' };
  }
  
  if (typeof context.round !== 'number' || context.round < 0 || context.round > 100) {
    return { valid: false, error: 'Invalid round value' };
  }
  
  if (!isValidLanguage(context.lang)) {
    return { valid: false, error: 'Invalid language' };
  }
  
  return { valid: true };
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const cached = requestCache.get(identifier);
  
  if (!cached || now - cached.timestamp > RATE_LIMIT_WINDOW) {
    // Reset window
    requestCache.set(identifier, { timestamp: now, count: 1 });
    return true;
  }
  
  if (cached.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  cached.count++;
  return true;
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW) {
      requestCache.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

export async function generateDogRoast(context: RoastContext): Promise<string | null> {
  // Input validation
  const validation = validateContext(context);
  if (!validation.valid) {
    console.error('❌ Validation error:', validation.error);
    return null;
  }
  
  // Rate limiting (using round as identifier for simplicity)
  const rateLimitId = `roast-${context.round}`;
  if (!checkRateLimit(rateLimitId)) {
    console.warn('⚠️  Rate limit exceeded');
    return null;
  }
  
  // Check if API is configured
  if (!genAI) {
    console.warn('⚠️  GEMINI_API_KEY not found, using fallback mocks.');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 50, // Limit response size for performance
        temperature: 0.9, // High creativity for roasts
      },
    });

    // Sanitize inputs to prevent prompt injection
    const sanitizedScore = Math.floor(context.score);
    const sanitizedMisses = Math.floor(context.misses);
    const sanitizedRound = Math.floor(context.round);
    const sanitizedLang = context.lang.toLowerCase();

    const prompt = `You are the Dog from Duck Hunt. It's 2026, and you are a snarky, Gen-Z influenced critic.
The player just finished a round or missed a shot.

Context:
- Score: ${sanitizedScore}
- Misses: ${sanitizedMisses}
- Round: ${sanitizedRound}
- Language: ${sanitizedLang} (en=English, hi=Hindi, hr=Haryanvi, rj=Rajasthani)

Task:
Generate a short, biting, funny roast in the specified language.
Keep it under 15 words. Use modern slang. Be savage but funny.
Output ONLY the roast text, nothing else.`;

    // Set timeout for API call (5 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('API timeout')), 5000)
    );
    
    const resultPromise = model.generateContent(prompt);
    
    const result = await Promise.race([resultPromise, timeoutPromise]);
    const text = result.response.text();
    
    // Sanitize output (remove potential XSS)
    const sanitizedText = text
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim()
      .substring(0, 200); // Max 200 chars
    
    return sanitizedText || null;
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Gemini API Error:', error.message);
    } else {
      console.error('❌ Unknown error:', error);
    }
    return null;
  }
}
