import { useEffect, useState, useCallback, useRef } from 'react'
import './Monster.css'
import { Constants } from '../../utils/Constants'

function Monster(props: any) {
    const [sourceImg, setSourceImg] = useState('')
    const [bouncing, setBouncing] = useState(false)
    const bounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        let type = Number.parseInt(props?.monster?.Type)
        let name = props?.monster?.Name
        setSourceImg(`/assets/monsters/${Constants.TypeMonster[type]}/${name}.gif`)
    }, [props, props?.monster])

    const handleClick = useCallback(() => {
        setBouncing(prev => {
            if (prev) return prev
            bounceTimer.current = setTimeout(() => setBouncing(false), 400)
            return true
        })
    }, [])

    useEffect(() => {
        return () => {
            if (bounceTimer.current) clearTimeout(bounceTimer.current)
        }
    }, [])

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
