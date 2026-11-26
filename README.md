# TypeCrest — Guided Touch Typing Instructor

> **Live Website:** [https://typecrest.pages.dev](https://typecrest.pages.dev)
>
> A modern, gamified, local-first touch typing platform featuring 3D articulated hands, biomechanical kinematics, adaptive remediation drills, official certificates, and a retro synthwave typing arcade.

---

## ✨ Overview

**TypeCrest** is designed to take typists from complete beginners to keyboard mastery through structured muscle-memory training, real-time visual feedback, and game-inspired progression loops.

The application runs entirely client-side with zero external database requirements, preserving user privacy while delivering 60 FPS animations, Web Audio procedural sound effects, and anti-tamper certification verification.

---

## 🚀 Key Features

### 🖐️ 3D Articulated Hands & Kinematic Keyboard
* **Three.js Skeletal Rig:** Articulated 3D hands loaded from high-polygon glTF models with realistic skin textures and joint movement.
* **Dynamic Shader Finger Highlighting:** Real-time vertex/fragment shader illumination on active fingers (`highlightMap` and `highlightStrength`).
* **Opposite-Hand Shift Coordination:** Automatically coordinates opposite-hand pinky finger reach for uppercase letters and shifted symbols.
* **Tactile Keypress Pulse:** Physical downward tap kinematics when typing keys.
* **Dual Rendering Modes:** Switch between **3D Skinned Hands** (WebGL) and **Classic Vector Hands** (SVG kinematics) with a single click.
* **Full ANSI QWERTY Layout:** Proportional key widths, secondary shifted symbols, homing bumps on `F` and `J`, and full on-screen clickability.

### 🎯 Focused Typing Workspace
* **Single-Text Direct Surface:** Eliminates duplicate input boxes by overlaying the active typing cursor directly on the prompt text.
* **Live Telemetry:** Tracks elapsed milliseconds, raw WPM, net WPM, accuracy percentage, and mistake distribution.
* **Instant Visual & Audio Feedback:** Green emerald highlights for correct keystrokes, red error shakes for mistypes, and procedural audio clicks.

### 🧬 Adaptive Remediation Engine ("Nourishment Drills")
* **Hotspot Detection:** Heuristic analyzer classifies tricky keys into 4 priority categories:
  1. *Priority Cluster Rule* (neighbor confusion)
  2. *Finger Overload Rule* (imbalanced finger strain)
  3. *Row/Shift Reach Rule* (vertical extensions or shift timing)
  4. *Single-Key Precision Rule* (isolated difficult keys)
* **3-Stage Dynamic Lesson Synthesis:** Isolated rhythm taps $\rightarrow$ Transition pairs $\rightarrow$ Real English words.
* **Hotspot Healing:** Automatically reduces or clears weak-key mistake counts when drills are passed with high accuracy ($\ge 96\%$).

### 🌿 Gamified Plant Growth System
* **10 Progressive Botanical Stages:** Nurture an evolving avatar from a *Dormant Seedling* (Lvl 1) through *Tender Sprout*, *Flourishing Bonsai*, and *Radiant Bloom Tree* up to the legendary *World Tree Yggdrasil* (Lvl 10).
* **Rewards & Streaks:** Earn XP, Dewdrops, and Bloom badges for completed lessons, speed milestones, and daily practice streaks.

### 📜 Formal Certificates of Achievement
* **Official Typing Certificates:** Issued automatically upon passing formal timed tests and exams.
* **Anti-Tamper Verification Codes:** Generated with polynomial hashing (`TMP-YYYY-XXXXXX`) over typist name, test metrics, and timestamp.
* **High-Resolution Export:** Renders an elegant certificate on HTML5 Canvas for instant PNG download and print.

### 🕹️ 2D Retro Cyberpunk Typing Arcade
Five original canvas typing games powered by procedural Web Audio synth music and an anti-cheat keystroke verification engine:
1. **Cyber-Dojo Showdown:** 2D fighting game where typed words unleash punches, kicks, and combos against dynamic AI opponents.
2. **Nitro Highway:** 60-second turbo racer with 3-lane traffic physics and nitro boost.
3. **Orbital Aegis:** Starfield laser defense turret with hex-shield protection.
4. **Synthwave Pulse:** 4-lane rhythm highway rewarding steady typing cadence.
5. **Titan Siege:** Multi-phase boss raid against armored dreadnoughts requiring punctuation and special character salvos.

### 🔒 Local-First Authentication & Privacy
* Client-side user accounts with PBKDF2 / SHA-256 salted password hashing.
* Instant guest mode with seamless profile upgrading and local data portability.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/), [TypeScript 5.8](https://www.typescriptlang.org/) |
| **Build & Tooling** | [Vite 6](https://vite.dev/), `@vitejs/plugin-react`, `tsx` |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`), [Lucide React](https://lucide.dev/) |
| **3D & Graphics** | [Three.js](https://threejs.org/) (glTF loader, skeletal animations), HTML5 Canvas 2D |
| **Audio Synthesis** | Web Audio API (procedural key clicks, chimes, dynamic synthwave music) |
| **Cryptography** | Web Crypto API (PBKDF2/SHA-256 + 16-byte random salt, FIPS 180-4 fallback) |

---

## 📁 Repository Structure

```
typingmaster/
├── public/
│   └── hands/                  # 3D glTF hand models, textures & highlight masks
├── scripts/
│   ├── qa-automation-suite.ts  # 9,900+ test automated QA suite
│   └── test-runner.ts          # Lesson inventory and calculation audits
├── src/
│   ├── arcade/                 # 2D Canvas games, synthwave audio, combat physics
│   ├── components/             # UI components & modals (Workspace, Dashboard, Analytics)
│   │   └── hands/              # Three.js 3D hands & SVG kinematics engines
│   ├── data/                   # Course curricula (Beginner, Intermediate, Advanced, Mastery)
│   ├── engines/                # GuidanceEngine & RemediationEngine
│   ├── utils/                  # Audio, growth, auth, certificates, safeStorage
│   ├── App.tsx                 # Root application state & router
│   ├── index.css               # Design tokens, keycap styling & Tailwind directives
│   ├── main.tsx                # Application bootstrap
│   └── types.ts                # Domain models & TypeScript interfaces
├── index.html                  # HTML entry point with custom typography
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite bundler configuration
```

---

## 🏁 Getting Started

### Prerequisites
* **Node.js:** v20.x or v22.x+ (tested on Node v24)
* **Package Manager:** `npm` (or `bun` / `pnpm`)

### Installation & Execution

```bash
# 1. Clone the repository
git clone https://github.com/webmaster0-maker/typingmaster-pro.git
cd typingmaster-pro

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
# Navigate to http://localhost:3000
```

### Build & Audit

```bash
# Type check TypeScript code
npm run lint

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Automated Testing

```bash
# Run course audit & inventory test runner
npx tsx scripts/test-runner.ts

# Run the 9,900+ test automated QA regression suite
npx tsx scripts/qa-automation-suite.ts
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
