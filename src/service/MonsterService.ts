import Database from '../data/database.json'
import MonsterModel from '../models/MonsterModel';

export interface UpdateResult {
    monster: MonsterModel
    evolved: boolean
}

export function MonsterFactory(monster: MonsterModel): Promise<MonsterModel> {
    if (new Date(monster.DateOfBirth).toISOString().slice(0, 10) !== new Date().toISOString().slice(0, 10) || monster.Id === '' || monster.Id === null)
        return InitBabyMonster();
    return Promise.resolve(monster);
}

export function GetMonster(monster: MonsterModel, id: string): Promise<MonsterModel> {
    const m = Database.monsters.find(x => x.Id === (id || monster.Id)) as MonsterModel
    m.Exp = monster.Exp
    m.DateOfBirth = monster.DateOfBirth
    return Promise.resolve(m)
}

export function UpdateMonster(monster: MonsterModel): Promise<UpdateResult> {
    if (monster.Exp < monster.Target || monster.Evolutions.length === 0)
        return Promise.resolve({ monster, evolved: false })
    return EvoMonster(monster).then(evolvedMonster => ({ monster: evolvedMonster, evolved: true }))
}

export function InitBabyMonster(): Promise<MonsterModel> {
    let monster = Database.monsters.find(x => x.Type === 0) as MonsterModel
    monster.DateOfBirth = new Date().toUTCString();
    return Promise.resolve(monster)
}

function EvoMonster(monster: MonsterModel): Promise<MonsterModel> {
    return GetMonster(monster, monster.Evolutions[GetRandomMonster(monster.Evolutions.length)]);
}

function GetRandomMonster(total: number): number {
    return Math.floor(Math.random() * total);
}
