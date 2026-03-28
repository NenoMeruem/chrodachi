# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Chrodachi is a Chrome Extension (Manifest V3) that functions as a Tamagotchi-style pet. It tracks time spent in the browser, displays elapsed time as HH:MM in the extension badge, and evolves a Digimon-inspired monster based on accumulated experience (time). A new "baby" monster spawns daily.

## Commands

```bash
# Development build (watch mode)
npm start

# Production build (watch mode, minified)
npm run build
```

There is no test runner configured. The output is built to a `dist/` directory, which you load as an unpacked extension in Chrome.

## Architecture

**Two entry points** defined in `webpack.common.js`:
- `src/popup/popup.tsx` — React UI rendered in the extension popup
- `src/worker/Worker.ts` — Chrome service worker (background process)

These compile to `popup.html` and `service.js` respectively, as referenced in `public/manifest.json`.

**Extension permissions:** `storage`, `alarms`

### Data Flow

1. **Service worker** (`Worker.ts`) runs on a Chrome alarm every minute — updates badge text with `HH:MM` elapsed time, advances monster EXP, triggers evolution via `MonsterService`
2. **Popup** (`App.tsx`) polls `MonsterService` every 60 seconds to refresh displayed state
3. **Persistence** is handled through `src/utils/Storage.ts`, which wraps Chrome's `chrome.storage.local` API with typed get/set for the monster model
4. **Monster state** is a `MonsterModel` stored as a single object in Chrome local storage

### Monster Evolution Chain

Constants in `src/utils/Constants.ts` define the ordered stages: `baby1 → baby2 → child → adult → perfect → ultimate → ultimate-plus`

Evolution metadata (names, EXP thresholds, which monster evolves into which) lives in `src/data/database.json`.

GIF sprites are in `public/assets/monsters/<stage>/`.

### Key Files

| File | Role |
|------|------|
| `src/service/MonsterService.ts` | Core logic: spawn, EXP gain, evolution checks |
| `src/models/MonsterModel.ts` | Monster state shape |
| `src/utils/Constants.ts` | Stage name mappings |
| `src/data/database.json` | Monster database (evolution trees) |
| `public/manifest.json` | Chrome extension manifest (MV3) |
