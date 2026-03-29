import MonsterModel from '../models/MonsterModel'
import GameStateModel from '../models/GameStateModel'
import { MonsterFactory, UpdateMonster } from '../service/MonsterService'
import { FormatDuration } from '../utils/Helper'
import { GetMonster, SetMonster } from '../utils/Storage'
import { GetGameState, SetGameState } from '../utils/GameStateStorage'
import { Constants } from '../utils/Constants'

const DECAY_THRESHOLD_MS = 7_200_000  // 2 hours inactive
const MIN_EXP_MS = 60_000             // minimum 1 minute EXP

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
        const isNewDay = rs.Id !== '' &&
            new Date(rs.DateOfBirth).getUTCDate() !== new Date().getUTCDate()

        MonsterFactory(rs).then(monster => {
            // Save retired monster to history if new day spawned a new baby
            if (isNewDay && rs.Name) {
                gameState.History.push({
                    Id: rs.Id,
                    Name: rs.Name,
                    Type: rs.Type,
                    DateOfBirth: rs.DateOfBirth,
                    DateRetired: new Date(now).toUTCString(),
                })
            }

            // Decay: if inactive > threshold, advance DateOfBirth (reduces effective Exp)
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
                // Save pre-evolution monster to history
                if (evolved && monster.Name !== updated.Name) {
                    gameState.History.push({
                        Id: monster.Id,
                        Name: monster.Name,
                        Type: monster.Type,
                        DateOfBirth: monster.DateOfBirth,
                        DateRetired: new Date(now).toUTCString(),
                    })
                }
                UpdateStreak(gameState, now)
                SetMonster(updated)
                SetGameState(gameState)
                UpdateBadge(updated)
                if (evolved) {
                    NotifyEvolution(updated)
                }
            })
        })
    })
})

function UpdateBadge(monster: MonsterModel) {
    chrome.action.setBadgeText({ text: FormatDuration(monster.Exp) })
    const color = Constants.BadgeColor[monster.Type] ?? '#aaaaaa'
    chrome.action.setBadgeBackgroundColor({ color })
}

function NotifyEvolution(monster: MonsterModel) {
    const stage = Constants.TypeMonster[monster.Type] ?? ''
    chrome.notifications.create('chrodachi-evolution', {
        type: 'basic',
        iconUrl: `assets/browser-action/action-38.png`,
        title: 'Chrodachi tiến hóa!',
        message: `${monster.Name} (${stage}) đã xuất hiện!`,
        priority: 1,
    })
}

function UpdateStreak(gameState: GameStateModel, now: number) {
    const todayUTC = new Date(now).toISOString().slice(0, 10)
    if (gameState.LastActiveDate === todayUTC) return

    const yesterday = new Date(now - 86_400_000).toISOString().slice(0, 10)
    if (gameState.LastActiveDate === yesterday) {
        gameState.Streak += 1
    } else {
        gameState.Streak = 1
    }
    gameState.LastActiveDate = todayUTC
    // No SetGameState here — caller saves once with all mutations
}
