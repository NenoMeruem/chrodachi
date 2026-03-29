import { useEffect, useState } from 'react';
import './App.css';
import Monster from './monster/Monster';
import Progress from './progress/Progress';
import History from './history/History';
import MonsterModel from '../models/MonsterModel';
import GameStateModel from '../models/GameStateModel';
import { GetMonster, SetMonster } from '../utils/Storage';
import { GetGameState, SetGameState } from '../utils/GameStateStorage';
import { InitBabyMonster } from '../service/MonsterService';

interface RamInfo {
    used: number   // GB used
    total: number  // GB total
    pct: number    // % used
}

function App() {
    const [monster, setMonster] = useState(new MonsterModel())
    const [gameState, setGameState] = useState(new GameStateModel())
    const [showHistory, setShowHistory] = useState(false)
    const [ram, setRam] = useState<RamInfo | null>(null)

    useEffect(() => {
        const refresh = async () => {
            const [m, g] = await Promise.all([GetMonster(), GetGameState()])
            setMonster(m)
            setGameState(g)
        }
        const refreshRam = () => {
            chrome.system.memory.getInfo((info) => {
                const total = info.capacity / (1024 ** 3)
                const available = info.availableCapacity / (1024 ** 3)
                const used = total - available
                setRam({
                    used: Math.round(used * 10) / 10,
                    total: Math.round(total * 10) / 10,
                    pct: Math.round((used / total) * 100),
                })
            })
        }
        refresh();
        refreshRam();
        const interval = setInterval(() => { refresh(); refreshRam() }, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleRelease = async () => {
        const [m, g] = await Promise.all([GetMonster(), GetGameState()])
        if (!m.Name) return
        g.History.push({
            Id: m.Id,
            Name: m.Name,
            Type: m.Type,
            DateOfBirth: m.DateOfBirth,
            DateRetired: new Date().toUTCString(),
        })
        g.MaxStageReachedAt = 0
        const baby = await InitBabyMonster()
        await Promise.all([SetMonster(baby), SetGameState(g)])
        setMonster(baby)
        setGameState({ ...g })
    }

    return (
        <div className="container">
            <Progress monster={monster} streak={gameState.Streak} ram={ram}></Progress>
            {showHistory
                ? <History entries={gameState.History} />
                : <Monster monster={monster}></Monster>
            }
            <div className="action-row">
                <button
                    className="history-toggle"
                    onClick={() => setShowHistory(v => !v)}
                >
                    {showHistory ? '▶ back' : '☰ history'}
                </button>
                <button
                    className="release-btn"
                    onClick={handleRelease}
                    title="Release monster and spawn new baby"
                >
                    ⏏ release
                </button>
            </div>
        </div>
    );
}

export default App;
