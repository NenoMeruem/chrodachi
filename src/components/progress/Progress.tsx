import { useEffect, useState } from 'react';
import './Progress.css'
import { Constants } from '../../utils/Constants';
import { FormatDuration } from '../../utils/Helper';

function Progress(props: any) {
    const [name, setName] = useState('')
    const [expBar, setExpBar] = useState(0)
    const [expText, setExpText] = useState('0:00')
    const [targetText, setTargetText] = useState('0:00')
    const [isMax, setIsMax] = useState(false)
    const ram = props?.ram ?? null
    const [stage, setStage] = useState('')
    const [streak, setStreak] = useState(0)

    useEffect(() => {
        const monster = props?.monster
        setName(monster?.Name || '--------')

        const exp = monster?.Exp ?? 0
        const target = monster?.Target ?? 1
        const type = monster?.Type ?? 0

        const maxStage = target === -1
        setIsMax(maxStage)
        setExpText(FormatDuration(exp))
        setTargetText(maxStage ? 'MAX' : FormatDuration(target))
        setStage(Constants.TypeMonster[type] ?? '')

        if (target > 0) {
            setExpBar(Math.min(100, Math.floor((exp / target) * 100)))
        } else {
            setExpBar(100)
        }

        setStreak(props?.streak ?? 0)
    }, [props, props?.monster, props?.streak])

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
                    <span className="time-label">AGE</span>
                    <span className="time-val">{expText}</span>
                    <span className="time-sep">→</span>
                    <span className={`time-label${isMax ? ' time-label-max' : ''}`}>EVO</span>
                    <span className={`time-val${isMax ? ' time-val-max' : ''}`}>{targetText}</span>
                </div>
                <div className="status-row">
                    <div className="streak-row">
                        <span className="streak-icon">★</span>
                        <span className="streak-val">{streak} day streak</span>
                    </div>
                    {ram && (
                        <div className="ram-chip">
                            <span className={`ram-chip-dot ${ram.pct < 60 ? 'ok' : ram.pct < 80 ? 'warn' : 'high'}`}></span>
                            <span className="ram-chip-text">{ram.used}/{ram.total}G</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Progress
