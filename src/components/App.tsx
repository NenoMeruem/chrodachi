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
            <Monster monster={monster}></Monster>
        </div>
    );
}

export default App;
