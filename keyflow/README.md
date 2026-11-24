# Keyflow

A React touch typing studio inspired by the supplied keyboard and hand references.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. To create a production build:

```sh
npm run build
npm run preview
```

The production output is `dist/` and can be hosted on any static web host.

## Included

- All 26 letter lessons, words, A–Z flow, and numbers/symbols practice.
- A full US QWERTY keyboard with physical and on-screen typing, virtual Shift and Caps Lock.
- Real articulated 3D hands, smooth pose transitions and highlighted fingers.
- Live WPM, accuracy, elapsed time, pause/restart and lesson completion.
- Learning history, personal best and progress charts, saved locally on the current browser/device.
- Hand visibility, finger hints, optional sound, dark appearance and responsive layouts.
- Reduced-motion support, keyboard navigation and accessible settings dialogs.

Use the highlighted key. Wrong keys do not advance the exercise. Backspace moves back; Escape pauses. Practice deliberately: clipboard paste is disabled in the typing input.

## Source guide

- `src/App.jsx`: practice UI, typing interactions, settings and progress.
- `src/lessons.js`: lessons, finger assignments and statistics.
- `src/Hands.jsx`: Three.js renderer and skeletal pose interpolation.
- `src/hands.js`: reference pose names and keyboard mappings.
- `src/styles.css`: desktop/mobile styling and dark appearance.
- `public/hands/`: self-contained hand model, skin texture and finger overlays.
- `tests/lessons.test.js`: lesson coverage, finger mapping and metric edge cases.

```sh
node --test tests/lessons.test.js
```

Hand textures and overlays come from the supplied reference ZIP. The missing model was recovered from the reference application's `typing.com` asset path and converted to standard glTF. The interface and lesson experience are newly implemented. The hand assets load locally; the optional Google Fonts stylesheet has system font fallbacks.

No server or account is required. History and preferences use browser localStorage.
