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
    MaxStageReachedAt: number = 0      // timestamp khi đạt max stage, để auto-reset
}

export default GameStateModel
