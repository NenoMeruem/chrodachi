import './History.css'
import { MonsterHistoryEntry } from '../../models/GameStateModel'
import { Constants } from '../../utils/Constants'

function History(props: { entries: MonsterHistoryEntry[] }) {
    const entries = [...props.entries].reverse()

    if (entries.length === 0) {
        return (
            <div className="history-container">
                <div className="history-empty">no history yet</div>
            </div>
        )
    }

    return (
        <div className="history-container">
            {entries.map((e, i) => (
                <div className="history-entry" key={`${e.Id}-${e.DateRetired}`}>
                    <img
                        className="history-img"
                        src={`/assets/monsters/${Constants.TypeMonster[e.Type]}/${e.Name}.gif`}
                        alt={e.Name}
                    />
                    <div className="history-info">
                        <span className="history-name">{e.Name}</span>
                        <span className="history-stage">{Constants.TypeMonster[e.Type]}</span>
                        <span className="history-date">{e.DateRetired.slice(0, 16)}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default History
