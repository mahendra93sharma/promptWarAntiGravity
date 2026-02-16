# Duck Hunt: The Snarky Simulation - Technical Architecture

## 1. High-Level Architecture
- **Frontend Framework:** Next.js (React)
  - Reasons: Server-Side Rendering for initial load, static generation for marketing pages, and robust API routes for backend proxying.
- **Styling:** TailwindCSS
  - Reasons: Rapid UI development, easier to maintain design systems.
- **State Management:** React Context + Hooks (or Zustand)
  - Managing game state (score, round, ammo, dog state).
- **Computer Vision:** MediaPipe Hands (Google)
  - Reasons: High performance, runs entirely client-side, reliable "gun" gesture detection.
- **AI Integration:** Google Gemini API (via Vercel AI SDK or direct fetch)
  - **Text Generation:** For Dog's dialogue.
  - **Image Generation (Optional):** For end-game graffiti.

## 2. Component Structure

### 2.1 Core Components
- `GameCanvas`: The main interactive layer. Handles the rendering of ducks and the crosshair.
- `VisionController`: An invisible component managing the webcam feed and MediaPipe processing. Emits coordinates {x, y} and trigger events.
- `TheDog`: A component that overlays the game. Contains the logic for fetching AI responses and displaying/speaking them.
- `ScoreBoard`: Displays current score, round, and ammo.
- `MainMenu`: Start screen with calibration instructions.

### 2.2 Data Flow
1.  **Input:** Webcam -> MediaPipe -> (x, y, gesture) -> Game Engine.
2.  **Game Logic:** Engine updates Duck positions. Checks collisions. Updates Score.
3.  **Event Trigger:** "Round End" or "Miss Streak" -> triggers `DogAI`.
4.  **AI Response:** `DogAI` sends context (Score: 2, Misses: 5, Lang: Haryanvi) to Gemini API -> Returns Text -> `TextToSpeech` plays audio.

## 3. Technology Stack Details
- **Language:** TypeScript
- **Vision:** `@mediapipe/hands`, `@mediapipe/camera_utils`
- **Animation:** `framer-motion` (for UI), `pixi.js` or HTML5 Canvas (for Game Loop ease). *Decision: HTML5 Canvas for performance.*
- **Deployment:** Google Cloud Run (Containerized Next.js app).

## 4. Security & Privacy
- **Camera:** Explicit permission request. Stream is processed in memory on the `navigator` and never transmitted.
- **API Keys:** Stored in environment variables on the server (Cloud Run / Vercel). Frontend calls backend API routes, which then call Gemini.

## 5. Testing Strategy
- **Unit Tests:** Jest + React Testing Library for UI components (Scoreboard, Menu).
- **Integration Tests:** Mocking MediaPipe to simulate gestures and checking Game Engine response.
- **E2E Tests:** Playwright (navigating menus, ensuring canvas loads).
