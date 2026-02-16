# Duck Hunt: The Snarky Simulation - Task List

## Phase 1: Planning & Design
- [x] Create Feature Requirements Document
- [x] Create Technical Architecture Document
- [ ] Initialize Stitch Project (UI Design)
- [ ] Create Designs for:
    - Main Menu (Neon/Retro style)
    - Game Overlay (HUD)
    - "The Dog" Dialogue Box
    - Scoreboard Screen

## Phase 2: Implementation (MVP)
- [ ] **Project Setup:** Initialize Next.js with TypeScript and Tailwind.
- [ ] **Game Engine (Canvas):**
    - Implement Duck sprite movement (flying logic).
    - Implement "Shot" mechanics (hit/miss detection).
- [ ] **Vision Integration:**
    - Integrate MediaPipe Hands.
    - specialized "Gun Hand" detection algorithm.
    - Map hand coordinates to screen crosshair.
- [ ] **The Dog (AI):**
    - Setup Gemini API route.
    - Create System Prompts for 4 personas (Hindi, Haryanvi, Rajasthani, English).
    - Implement Text-to-Speech (Window SpeechSynthesis or external API).
- [ ] **Game Loop:**
    - Round management (1-20).
    - Score tracking.
    - Win/Loss states.

## Phase 3: Testing & QA
- [ ] Unit Tests for Game Logic (collision detection).
- [ ] UI Tests for responsiveness.
- [ ] Security Audit (API Key handling).
- [ ] "Fun Factor" testing (tuning Dog's frequency).

## Phase 4: Deployment
- [ ] Dockerize the application.
- [ ] Deploy to Google Cloud Run.
- [ ] Final Verification.
