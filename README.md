# Chrodachi

A Chrome extension that turns your browsing time into a Tamagotchi-style experience. The longer you stay in the browser, the more your monster grows and evolves.

## How It Works

- A new baby monster spawns each day
- Every minute you spend in the browser earns your monster EXP
- Your monster evolves through 7 stages: `baby1 → baby2 → child → adult → perfect → ultimate → ultimate-plus`
- Elapsed time is shown as `HH:MM` in the extension badge, color-coded by stage
- If you're inactive for more than 2 hours, EXP decays proportionally
- At max stage (`ultimate-plus`), the monster auto-retires after 2 hours and a new baby spawns

## Popup UI

| Section | Description |
|---------|-------------|
| **Stats card** | Monster name, stage badge, EXP bar with percentage, AGE → EVO time display |
| **Streak + RAM** | Daily login streak (★) and system RAM chip (green/yellow/red by usage) |
| **Scene** | Animated monster walking across a landscape — click to bounce |
| **☰ History** | Toggle to see all past monsters with sprite, stage, and retirement date |
| **⏏ Release** | Retire current monster immediately and spawn a new baby |

## Development

**Prerequisites:** Node.js, npm

```bash
npm install

# Development build (watch mode)
npm start

# Production build (watch mode, minified)
npm run build
```

Output is written to `build/`. Load it as an unpacked extension in Chrome via `chrome://extensions` with Developer Mode enabled.

> After adding a new permission (e.g. `system.memory`), remove and re-add the extension — Chrome does not apply new permissions on a simple reload.

## Tech Stack

- React 18 + TypeScript
- Webpack 5 (custom config)
- Chrome Extension Manifest V3
- Chrome APIs: `storage`, `alarms`, `notifications`, `system.memory`

## Architecture

Two entry points:

| Entry | Output | Role |
|-------|--------|------|
| `src/popup/popup.tsx` | `popup.html` | React UI rendered in the extension popup |
| `src/worker/Worker.ts` | `service.js` | Chrome service worker — runs every minute via `chrome.alarms` |

The service worker handles EXP calculation, decay, evolution, streak tracking, history writes, and badge updates. The popup reads state from `chrome.storage.local` and re-renders every 60 seconds.

Monster and game metadata are stored as two separate keys: `monster` (current state) and `gameState` (streak, history, decay timer).
