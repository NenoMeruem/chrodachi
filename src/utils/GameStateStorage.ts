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
