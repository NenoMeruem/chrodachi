# Chrodachi

A Chrome extension that turns your browsing time into a Tamagotchi-style experience. The longer you stay in the browser, the more your monster grows and evolves.

## How It Works

- A new baby monster spawns each day
- Every minute you spend in the browser earns your monster EXP
- Your monster evolves through 7 stages: `baby1 → baby2 → child → adult → perfect → ultimate → ultimate-plus`
- Elapsed time is shown as `HH:MM` in the extension badge

## Development

**Prerequisites:** Node.js, npm

```bash
npm install

# Development build (watch mode)
npm start

# Production build (watch mode, minified)
npm run build
```

Output is written to `dist/`. Load it as an unpacked extension in Chrome via `chrome://extensions` with Developer Mode enabled.

## Tech Stack

- React 18 + TypeScript
- Webpack 5 (custom config, no CRA)
- Chrome Extension Manifest V3
- Chrome APIs: `storage`, `alarms`
