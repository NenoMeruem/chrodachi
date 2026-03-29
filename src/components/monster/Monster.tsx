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
