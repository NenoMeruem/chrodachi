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
            </div>
        </div>
    );
}

export default Progress