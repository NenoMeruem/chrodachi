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

    useEffect(() => {
        const refresh = async () => {
            const [m, g] = await Promise.all([GetMonster(), GetGameState()])
            setMonster(m)
            setGameState(g)
        }
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
