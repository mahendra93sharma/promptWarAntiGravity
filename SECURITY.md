# Security & Code Quality Report

## 1. Security Architecture
- **API Key Protection**: The Google Gemini API Key is stored in environment variables (`GEMINI_API_KEY`) and accessed *only* via Server Actions (`src/app/actions.ts`). It is never exposed to the client-side bundle.
- **Client-Side Processing**: The webcam feed is processed entirely in the browser using MediaPipe. No video data is transmitted to any server, ensuring user privacy.
- **Input Sanitization**: The inputs to the LLM (score, misses) are typed numbers, preventing prompt injection attacks via game state manipulation.

## 2. Code Quality
- **Type Safety**: The project uses strict TypeScript configuration.
- **Linting**: ESLint is configured with Next.js best practices.
- **Testing**: Unit tests are implemented for game logic using Vitest.
- **Modular Design**: 
    - `VisionController`: Encapsulated CV logic.
    - `GameCanvas`: Isolated rendering logic.
    - `SnarkyDog`: Separate AI interaction component.

## 3. Potential Improvements
- **Rate Limiting**: The Server Action should implement rate limiting to prevent API abuse if the endpoint is discovered.
- **Headless UI Testing**: Add Cypress/Playwright for end-to-end testing of the "Shoot" mechanic.
