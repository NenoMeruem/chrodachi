# Chrodachi Feature Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm 6 tính năng gameplay và UX vào Chrome extension Chrodachi: badge màu theo stage, click animation, EXP decay khi không dùng, notification khi tiến hóa, streak hàng ngày, và monster history.

**Architecture:** Tách game metadata (streak, history, lastAlarm) ra một storage key riêng `gameState` để không làm phức tạp MonsterModel. Decay được thực hiện bằng cách dời `DateOfBirth` về phía trước (giảm Exp hiệu dụng). Notification và badge color được xử lý trong Worker. History và Streak được hiển thị trực tiếp trong App.tsx popup.

**Tech Stack:** TypeScript, React 18, Chrome Extension MV3 (chrome.notifications, chrome.action, chrome.storage.local), Webpack 5

---

## File Map

| File | Action | Mục đích |
|------|--------|----------|
| `src/models/GameStateModel.ts` | **Tạo mới** | Model cho streak, history, lastAlarmTime |
| `src/utils/GameStateStorage.ts` | **Tạo mới** | get/set GameState từ chrome.storage |
| `src/utils/Constants.ts` | **Sửa** | Thêm badge color map theo type |
| `src/worker/Worker.ts` | **Sửa** | Decay, streak update, badge color, evolution notification |
| `src/service/MonsterService.ts` | **Sửa** | Trả về flag `evolved: boolean` để Worker biết khi nào notify |
| `src/components/monster/Monster.tsx` | **Sửa** | Thêm click handler + bounce state |
| `src/components/monster/Monster.css` | **Sửa** | Thêm @keyframes bounce |
| `src/components/App.tsx` | **Sửa** | Load và truyền gameState xuống Progress |
| `src/components/progress/Progress.tsx` | **Sửa** | Hiển thị streak |
| `src/components/history/History.tsx` | **Tạo mới** | Hiển thị danh sách monster đã nuôi |
| `src/components/history/History.css` | **Tạo mới** | Style cho history panel |
| `public/manifest.json` | **Sửa** | Thêm permission `notifications` |

---

## Task 1: GameStateModel + GameStateStorage

**Files:**
- Create: `src/models/GameStateModel.ts`
- Create: `src/utils/GameStateStorage.ts`

- [ ] **Step 1: Tạo GameStateModel**

```typescript
// src/models/GameStateModel.ts
export interface MonsterHistoryEntry {
    Id: string
    Name: string
    Type: number
    DateOfBirth: string
    DateRetired: string
}

class GameStateModel {
    LastAlarmTime: number = 0          // timestamp ms, để tính decay
    Streak: number = 0                  // số ngày liên tiếp
    LastActiveDate: string = ''         // 'YYYY-MM-DD' UTC
    History: MonsterHistoryEntry[] = [] // danh sách monster đã qua
}

export default GameStateModel
```

- [ ] **Step 2: Tạo GameStateStorage**

```typescript
// src/utils/GameStateStorage.ts
import GameStateModel from '../models/GameStateModel'

const KEY = 'gameState'

export function GetGameState(): Promise<GameStateModel> {
    return new Promise((resolve) => {
        chrome.storage.local.get(KEY, (res: any) => {
            resolve(res[KEY] ? res[KEY] : new GameStateModel())
        })
    })
}

export function SetGameState(state: GameStateModel): Promise<GameStateModel> {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [KEY]: state }, () => {
            resolve(state)
        })
    })
}
```

- [ ] **Step 3: Build kiểm tra**

```bash
npx webpack --config webpack.prod.js 2>&1 | grep -E "(ERROR|compiled)"
```
Expected: `compiled successfully`

- [ ] **Step 4: Commit**

```bash
git add src/models/GameStateModel.ts src/utils/GameStateStorage.ts
git commit -m "feat: add GameStateModel and GameStateStorage for streak/history/decay"
```

---

## Task 2: Feature 6 — Badge color theo stage

**Files:**
- Modify: `src/utils/Constants.ts`
- Modify: `src/worker/Worker.ts`

- [ ] **Step 1: Thêm BadgeColor vào Constants**

```typescript
// src/utils/Constants.ts
export class Constants {
    static readonly TypeMonster = [
        'baby1',
        'baby2',
        'child',
        'adult',
        'perfect',
        'ultimate',
        'ultimate-plus'
    ]

    static readonly BadgeColor: { [key: number]: string } = {
        0: '#aaaaaa', // baby1 - xám
        1: '#88aaff', // baby2 - xanh nhạt
        2: '#55cc55', // child - xanh lá
        3: '#ffaa33', // adult - cam
        4: '#aa44ff', // perfect - tím
        5: '#ff4444', // ultimate - đỏ
        6: '#ffcc00', // ultimate-plus - vàng
    }
}
```

- [ ] **Step 2: Sửa Worker.ts dùng BadgeColor**

Tìm hàm `UpdateBadge` trong `src/worker/Worker.ts` và sửa:

```typescript
function UpdateBadge(monster: MonsterModel) {
    chrome.action.setBadgeText({ text: FormatDuration(monster.Exp) })
    const color = Constants.BadgeColor[monster.Type] ?? '#aaaaaa'
    chrome.action.setBadgeBackgroundColor({ color })
}
```

Thêm import ở đầu file:
```typescript
import { Constants } from '../utils/Constants'
```

Xóa dòng badge color cứng ở đầu file:
```typescript
// Xóa dòng này:
chrome.action.setBadgeBackgroundColor({ 'color': "#f6d7b1" });
```

- [ ] **Step 3: Build kiểm tra**

```bash
npx webpack --config webpack.prod.js 2>&1 | grep -E "(ERROR|compiled)"
```
Expected: `compiled successfully`

- [ ] **Step 4: Commit**

```bash
git add src/utils/Constants.ts src/worker/Worker.ts
git commit -m "feat: badge color changes by monster stage"
```

---

## Task 3: Feature 5 — Click animation trên monster

**Files:**
- Modify: `src/components/monster/Monster.tsx`
- Modify: `src/components/monster/Monster.css`

- [ ] **Step 1: Thêm bounce keyframe vào Monster.css**

Append vào cuối `src/components/monster/Monster.css`:

```css
/* bounce on click */
.animated-gif.bounce {
    animation: moving 14s linear infinite, bounce 0.4s steps(4) 1;
}

@keyframes bounce {
    0%   { transform: translateY(0) scaleX(var(--flip, 1)); }
    25%  { transform: translateY(-12px) scaleX(var(--flip, 1)); }
    50%  { transform: translateY(-6px) scaleX(var(--flip, 1)); }
    75%  { transform: translateY(-10px) scaleX(var(--flip, 1)); }
    100% { transform: translateY(0) scaleX(var(--flip, 1)); }
}
```

- [ ] **Step 2: Sửa Monster.tsx thêm click state**

```typescript
// src/components/monster/Monster.tsx
import { useEffect, useState, useCallback } from 'react'
import './Monster.css'
import { Constants } from '../../utils/Constants'

function Monster(props: any) {
    const [sourceImg, setSourceImg] = useState('')
    const [bouncing, setBouncing] = useState(false)

    useEffect(() => {
        let type = Number.parseInt(props?.monster?.Type)
        let name = props?.monster?.Name
        setSourceImg(`/assets/monsters/${Constants.TypeMonster[type]}/${name}.gif`)
    }, [props, props?.monster])

    const handleClick = useCallback(() => {
        if (bouncing) return
        setBouncing(true)
        setTimeout(() => setBouncing(false), 400)
    }, [bouncing])

    return (
        <div className="animation-container" onClick={handleClick}>
            <img
                src={sourceImg}
                alt="monster"
                className={`animated-gif${bouncing ? ' bounce' : ''}`}
            />
        </div>
    )
}

export default Monster
```

- [ ] **Step 3: Build kiểm tra**

```bash
npx webpack --config webpack.prod.js 2>&1 | grep -E "(ERROR|compiled)"
```
Expected: `compiled successfully`

- [ ] **Step 4: Reload extension, click vào monster — phải thấy bounce animation**

- [ ] **Step 5: Commit**

```bash
git add src/components/monster/Monster.tsx src/components/monster/Monster.css
git commit -m "feat: click monster to trigger bounce animation"
```

---

## Task 4: Feature 1 — EXP Decay khi không dùng browser

**Logic:** Mỗi lần alarm chạy, so sánh `now` với `LastAlarmTime`. Nếu gap > 2 giờ (7_200_000ms), advance `DateOfBirth` thêm `(gap - 2h)` → giảm Exp hiệu dụng. Giới hạn DateOfBirth không vượt quá `now - 60_000` (tối thiểu 1 phút EXP).

**Files:**
- Modify: `src/worker/Worker.ts`

- [ ] **Step 1: Sửa Worker.ts — thêm decay logic**

Toàn bộ `src/worker/Worker.ts` sau khi sửa:

```typescript
import MonsterModel from '../models/MonsterModel'
import { MonsterFactory, UpdateMonster } from '../service/MonsterService'
import { FormatDuration } from '../utils/Helper'
import { GetMonster, SetMonster } from '../utils/Storage'
import { GetGameState, SetGameState } from '../utils/GameStateStorage'
import { Constants } from '../utils/Constants'

const DECAY_THRESHOLD_MS = 7_200_000  // 2 jam tidak aktif
const MIN_EXP_MS = 60_000             // minimum 1 menit EXP

chrome.action.setBadgeText({ text: '0:00' })
chrome.action.setBadgeBackgroundColor({ color: '#aaaaaa' })

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create({ periodInMinutes: 1.0 })
    GetMonster().then((rs: MonsterModel) => {
        MonsterFactory(rs).then(monster => SetMonster(monster))
    })
})

chrome.alarms.onAlarm.addListener(() => {
    const now = Date.now()

    Promise.all([GetMonster(), GetGameState()]).then(([rs, gameState]) => {
        MonsterFactory(rs).then(monster => {
            // Decay: nếu inactive > threshold, dời DateOfBirth về phía trước
            if (gameState.LastAlarmTime > 0) {
                const gap = now - gameState.LastAlarmTime
                if (gap > DECAY_THRESHOLD_MS) {
                    const penalty = gap - DECAY_THRESHOLD_MS
                    const dob = new Date(monster.DateOfBirth).getTime()
                    const maxDob = now - MIN_EXP_MS
                    monster.DateOfBirth = new Date(Math.min(dob + penalty, maxDob)).toUTCString()
                }
            }
            gameState.LastAlarmTime = now

            monster.Exp = now - new Date(monster.DateOfBirth).getTime()

            UpdateMonster(monster).then(updated => {
                SetMonster(updated)
                SetGameState(gameState)
                UpdateBadge(updated)
                UpdateStreak(gameState, now)
            })
        })
    })
})

function UpdateBadge(monster: MonsterModel) {
    chrome.action.setBadgeText({ text: FormatDuration(monster.Exp) })
    const color = Constants.BadgeColor[monster.Type] ?? '#aaaaaa'
    chrome.action.setBadgeBackgroundColor({ color })
}

function UpdateStreak(gameState: any, now: number) {
    const todayUTC = new Date(now).toISOString().slice(0, 10)
    if (gameState.LastActiveDate === todayUTC) return

    const yesterday = new Date(now - 86_400_000).toISOString().slice(0, 10)
    if (gameState.LastActiveDate === yesterday) {
        gameState.Streak += 1
    } else {
        gameState.Streak = 1
    }
    gameState.LastActiveDate = todayUTC
    SetGameState(gameState)
}
```

- [ ] **Step 2: Build kiểm tra**

```bash
npx webpack --config webpack.prod.js 2>&1 | grep -E "(ERROR|compiled)"
```
Expected: `compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/worker/Worker.ts
git commit -m "feat: EXP decay after 2h inactivity + streak tracking in worker"
```

---

## Task 5: Feature 4 — Notification khi tiến hóa

**Files:**
- Modify: `public/manifest.json`
- Modify: `src/service/MonsterService.ts`
- Modify: `src/worker/Worker.ts`

- [ ] **Step 1: Thêm permission notifications vào manifest**

```json
// public/manifest.json
{
    "manifest_version": 3,
    "name": "Chrodachi",
    "description": "How long have I been on google?",
    "version": "1.0",
    "icons": {
        "19": "assets/browser-action/action-19.png",
        "38": "assets/browser-action/action-38.png"
    },
    "action": {
        "default_popup": "popup.html"
    },
    "background": {
        "service_worker": "service.js",
        "type": "module"
    },
    "permissions": [
        "storage",
        "alarms",
        "notifications"
    ]
}
```

- [ ] **Step 2: Sửa MonsterService.ts — UpdateMonster trả về evolved flag**

```typescript
// src/service/MonsterService.ts
import Database from '../data/database.json'
import MonsterModel from '../models/MonsterModel';

export interface UpdateResult {
    monster: MonsterModel
    evolved: boolean
}

export function MonsterFactory(monster: MonsterModel): Promise<MonsterModel> {
    if (new Date(monster.DateOfBirth).getUTCDate() !== new Date().getUTCDate() || monster.Id === '' || monster.Id === null)
        return InitBabyMonster();
    return Promise.resolve(monster);
}

export function GetMonster(monster: MonsterModel, id: string): Promise<MonsterModel> {
    const m = Database.monsters.find(x => x.Id === (id || monster.Id)) as MonsterModel
    m.Exp = monster.Exp
    m.DateOfBirth = monster.DateOfBirth
    return Promise.resolve(m)
}

export function UpdateMonster(monster: MonsterModel): Promise<UpdateResult> {
    if (monster.Exp < monster.Target || monster.Evolutions.length === 0)
        return Promise.resolve({ monster, evolved: false })
    return EvoMonster(monster).then(evolved => ({ monster: evolved, evolved: true }))
}

function InitBabyMonster(): Promise<MonsterModel> {
    let monster = Database.monsters.find(x => x.Type === 0) as MonsterModel
    monster.DateOfBirth = new Date().toUTCString();
    return Promise.resolve(monster)
}

function EvoMonster(monster: MonsterModel): Promise<MonsterModel> {
    return GetMonster(monster, monster.Evolutions[GetRandomMonster(monster.Evolutions.length)]);
}

function GetRandomMonster(total: number): number {
    return Math.floor(Math.random() * total);
}
```

- [ ] **Step 3: Sửa Worker.ts — dùng UpdateResult và gửi notification**

Sửa phần gọi `UpdateMonster` trong `chrome.alarms.onAlarm.addListener`:

```typescript
UpdateMonster(monster).then(({ monster: updated, evolved }) => {
    SetMonster(updated)
    SetGameState(gameState)
    UpdateBadge(updated)
    UpdateStreak(gameState, now)
    if (evolved) {
        NotifyEvolution(updated)
    }
})
```

Thêm hàm `NotifyEvolution` vào cuối Worker.ts:

```typescript
function NotifyEvolution(monster: MonsterModel) {
    const stage = Constants.TypeMonster[monster.Type] ?? ''
    chrome.notifications.create({
        type: 'basic',
        iconUrl: `assets/browser-action/action-38.png`,
        title: 'Chrodachi tiến hóa!',
        message: `${monster.Name} (${stage}) đã xuất hiện!`,
        priority: 1,
    })
}
```

- [ ] **Step 4: Build kiểm tra**

```bash
npx webpack --config webpack.prod.js 2>&1 | grep -E "(ERROR|compiled)"
```
Expected: `compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add public/manifest.json src/service/MonsterService.ts src/worker/Worker.ts
git commit -m "feat: chrome notification when monster evolves"
```

---

## Task 6: Feature 7 — Hiển thị Streak trong Popup

**Files:**
- Modify: `src/components/App.tsx`
- Modify: `src/components/progress/Progress.tsx`
- Modify: `src/components/progress/Progress.css`

- [ ] **Step 1: Sửa App.tsx — load gameState và truyền xuống**

```typescript
// src/components/App.tsx
import { useEffect, useState } from 'react';
import './App.css';
import Monster from './monster/Monster';
import Progress from './progress/Progress';
import MonsterModel from '../models/MonsterModel';
import GameStateModel from '../models/GameStateModel';
import { GetMonster } from '../utils/Storage';
import { GetGameState } from '../utils/GameStateStorage';

function App() {
    const [monster, setMonster] = useState(new MonsterModel())
    const [gameState, setGameState] = useState(new GameStateModel())

    const refresh = async () => {
        const [m, g] = await Promise.all([GetMonster(), GetGameState()])
        setMonster(m)
        setGameState(g)
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container">
            <Progress monster={monster} streak={gameState.Streak}></Progress>
            <Monster monster={monster}></Monster>
        </div>
    );
}

export default App;
```

- [ ] **Step 2: Sửa Progress.tsx — thêm streak prop**

```typescript
// src/components/progress/Progress.tsx
import { useEffect, useState } from 'react';
import './Progress.css'
import { Constants } from '../../utils/Constants';
import { FormatDuration } from '../../utils/Helper';

function Progress(props: any) {
    const [name, setName] = useState('')
    const [expBar, setExpBar] = useState(0)
    const [expText, setExpText] = useState('0:00')
    const [targetText, setTargetText] = useState('0:00')
    const [stage, setStage] = useState('')

    useEffect(() => {
        const monster = props?.monster
        setName(monster?.Name || '--------')

        const exp = monster?.Exp ?? 0
        const target = monster?.Target ?? 1
        const type = monster?.Type ?? 0

        setExpText(FormatDuration(exp))
        setTargetText(target > 0 ? FormatDuration(target) : '???')
        setStage(Constants.TypeMonster[type] ?? '')

        if (target > 0) {
            setExpBar(Math.min(100, Math.floor((exp / target) * 100)))
        } else {
            setExpBar(100)
        }
    }, [props, props?.monster])

    const streak = props?.streak ?? 0

    return (
        <div className="header">
            <div className="evolution-outer-container">
                <div className="name-row">
                    <span className="title">{name}</span>
                    <span className="stage-badge">{stage}</span>
                </div>
                <div className="exp-row">
                    <span className="exp-label">EXP</span>
                    <div className="hp-inner-container">
                        <div className="hp-indicator" style={{ width: `${expBar}%` }}></div>
                    </div>
                    <span className="exp-pct">{expBar}%</span>
                </div>
                <div className="time-row">
                    <span className="time-val">{expText}</span>
                    <span className="time-sep">/</span>
                    <span className="time-val">{targetText}</span>
                </div>
                <div className="streak-row">
                    <span className="streak-icon">★</span>
                    <span className="streak-val">{streak} day streak</span>
                </div>
            </div>
        </div>
    );
}

export default Progress
```

- [ ] **Step 3: Thêm streak style vào Progress.css**

Append vào cuối `src/components/progress/Progress.css`:

```css
/* streak */
.streak-row {
    display: flex;
    align-items: center;
    gap: 3px;
    margin-top: 1px;
}

.streak-icon {
    font-size: 10px;
    color: #ffaa00;
    line-height: 1;
}

.streak-val {
    font-family: 'visitor', monospace;
    font-size: 10px;
    color: #555555;
    letter-spacing: 0.5px;
}
```

- [ ] **Step 4: Build kiểm tra**

```bash
npx webpack --config webpack.prod.js 2>&1 | grep -E "(ERROR|compiled)"
```
Expected: `compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add src/components/App.tsx src/components/progress/Progress.tsx src/components/progress/Progress.css
git commit -m "feat: display daily streak in popup"
```

---

## Task 7: Feature 3 — Monster History

**Files:**
- Create: `src/components/history/History.tsx`
- Create: `src/components/history/History.css`
- Modify: `src/worker/Worker.ts` — lưu monster vào history khi evolve hoặc new day
- Modify: `src/components/App.tsx` — toggle history panel
- Modify: `src/components/App.css` — thêm toggle button style

- [ ] **Step 1: Tạo History.tsx**

```typescript
// src/components/history/History.tsx
import './History.css'
import { MonsterHistoryEntry } from '../../models/GameStateModel'
import { Constants } from '../../utils/Constants'

function History(props: { entries: MonsterHistoryEntry[] }) {
    const entries = [...props.entries].reverse()

    if (entries.length === 0) {
        return (
            <div className="history-container">
                <div className="history-empty">no history yet</div>
            </div>
        )
    }

    return (
        <div className="history-container">
            {entries.map((e, i) => (
                <div className="history-entry" key={i}>
                    <img
                        className="history-img"
                        src={`/assets/monsters/${Constants.TypeMonster[e.Type]}/${e.Name}.gif`}
                        alt={e.Name}
                    />
                    <div className="history-info">
                        <span className="history-name">{e.Name}</span>
                        <span className="history-stage">{Constants.TypeMonster[e.Type]}</span>
                        <span className="history-date">{e.DateRetired.slice(0, 16)}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default History
```

- [ ] **Step 2: Tạo History.css**

```css
/* history panel */
.history-container {
    width: 100%;
    flex: 1;
    border: 2px solid #2a2a2a;
    box-shadow: 2px 2px 0 #2a2a2a;
    background: #d8d8d0;
    overflow-y: auto;
    padding: 4px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.history-empty {
    font-family: 'visitor', monospace;
    font-size: 11px;
    color: #777777;
    text-align: center;
    margin-top: 10px;
}

.history-entry {
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid #aaaaaa;
    padding-bottom: 3px;
}

.history-img {
    width: 28px;
    height: 28px;
    image-rendering: pixelated;
    object-fit: contain;
}

.history-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.history-name {
    font-family: 'visitor', monospace;
    font-size: 11px;
    color: #2a2a2a;
}

.history-stage {
    font-family: 'visitor', monospace;
    font-size: 9px;
    color: #555555;
    text-transform: uppercase;
}

.history-date {
    font-family: 'visitor', monospace;
    font-size: 8px;
    color: #888888;
}
```

- [ ] **Step 3: Sửa Worker.ts — lưu monster vào history khi evolve hoặc new day**

Trong hàm `chrome.alarms.onAlarm.addListener`, sửa block `MonsterFactory` để detect new day và lưu history:

```typescript
chrome.alarms.onAlarm.addListener(() => {
    const now = Date.now()

    Promise.all([GetMonster(), GetGameState()]).then(([rs, gameState]) => {
        const isNewDay = rs.Id !== '' &&
            new Date(rs.DateOfBirth).getUTCDate() !== new Date().getUTCDate()

        MonsterFactory(rs).then(monster => {
            // Save old monster to history if new day spawned a new baby
            if (isNewDay && rs.Name) {
                gameState.History.push({
                    Id: rs.Id,
                    Name: rs.Name,
                    Type: rs.Type,
                    DateOfBirth: rs.DateOfBirth,
                    DateRetired: new Date(now).toUTCString(),
                })
            }

            // Decay
            if (gameState.LastAlarmTime > 0) {
                const gap = now - gameState.LastAlarmTime
                if (gap > DECAY_THRESHOLD_MS) {
                    const penalty = gap - DECAY_THRESHOLD_MS
                    const dob = new Date(monster.DateOfBirth).getTime()
                    const maxDob = now - MIN_EXP_MS
                    monster.DateOfBirth = new Date(Math.min(dob + penalty, maxDob)).toUTCString()
                }
            }
            gameState.LastAlarmTime = now

            monster.Exp = now - new Date(monster.DateOfBirth).getTime()

            UpdateMonster(monster).then(({ monster: updated, evolved }) => {
                // Save to history on evolution too
                if (evolved && monster.Name !== updated.Name) {
                    gameState.History.push({
                        Id: monster.Id,
                        Name: monster.Name,
                        Type: monster.Type,
                        DateOfBirth: monster.DateOfBirth,
                        DateRetired: new Date(now).toUTCString(),
                    })
                }
                SetMonster(updated)
                SetGameState(gameState)
                UpdateBadge(updated)
                UpdateStreak(gameState, now)
                if (evolved) {
                    NotifyEvolution(updated)
                }
            })
        })
    })
})
```

- [ ] **Step 4: Sửa App.tsx — thêm toggle history view**

```typescript
// src/components/App.tsx
import { useEffect, useState } from 'react';
import './App.css';
import Monster from './monster/Monster';
import Progress from './progress/Progress';
import History from './history/History';
import MonsterModel from '../models/MonsterModel';
import GameStateModel from '../models/GameStateModel';
import { GetMonster } from '../utils/Storage';
import { GetGameState } from '../utils/GameStateStorage';

function App() {
    const [monster, setMonster] = useState(new MonsterModel())
    const [gameState, setGameState] = useState(new GameStateModel())
    const [showHistory, setShowHistory] = useState(false)

    const refresh = async () => {
        const [m, g] = await Promise.all([GetMonster(), GetGameState()])
        setMonster(m)
        setGameState(g)
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container">
            <Progress monster={monster} streak={gameState.Streak}></Progress>
            {showHistory
                ? <History entries={gameState.History} />
                : <Monster monster={monster}></Monster>
            }
            <button
                className="history-toggle"
                onClick={() => setShowHistory(v => !v)}
            >
                {showHistory ? '▶ back' : '☰ history'}
            </button>
        </div>
    );
}

export default App;
```

- [ ] **Step 5: Thêm history-toggle style vào App.css**

```css
/* history toggle button */
.history-toggle {
    width: 100%;
    background: #d8d8d0;
    border: 2px solid #2a2a2a;
    box-shadow: 2px 2px 0 #2a2a2a;
    font-family: 'visitor', monospace;
    font-size: 10px;
    color: #2a2a2a;
    padding: 3px 0;
    cursor: pointer;
    letter-spacing: 1px;
    text-align: center;
}

.history-toggle:active {
    box-shadow: none;
    transform: translate(2px, 2px);
}
```

- [ ] **Step 6: Build kiểm tra**

```bash
npx webpack --config webpack.prod.js 2>&1 | grep -E "(ERROR|compiled)"
```
Expected: `compiled successfully`

- [ ] **Step 7: Commit**

```bash
git add src/components/history/History.tsx src/components/history/History.css \
        src/worker/Worker.ts src/components/App.tsx src/components/App.css
git commit -m "feat: monster history panel with toggle"
```

---

## Kiểm tra thủ công sau khi hoàn thành

1. **Badge color:** Reload extension → badge màu xám (#aaaaaa cho baby1). Sau khi Exp đủ evolve → màu phải đổi theo stage.
2. **Click animation:** Click vào monster → bounce 1 lần rồi trở lại animation chạy.
3. **Streak:** Mở popup ngày hôm nay → `1 day streak`. Ngày mai mở lại → `2 day streak`.
4. **Decay:** Set `DECAY_THRESHOLD_MS = 60_000` (1 phút) tạm thời, đợi 2 phút, mở popup → EXP giảm. Sau khi test xong đổi lại `7_200_000`.
5. **Notification:** Dùng Chrome DevTools → Service Worker console, manually trigger `UpdateMonster` với Exp > Target.
6. **History:** Đợi monster evolve (hoặc manual trigger trong DevTools) → click "☰ history" → thấy entry.
