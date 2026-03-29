import MonsterModel from "../models/MonsterModel";
import { MonsterFactory, UpdateMonster } from "../service/MonsterService";
import { FormatDuration } from "../utils/Helper";
import { GetMonster, SetMonster } from "../utils/Storage";
import { Constants } from '../utils/Constants'

chrome.action.setBadgeText({ 'text': '0:00' });

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create({periodInMinutes: 1.0})
  GetMonster().then((rs: MonsterModel) => {
    MonsterFactory(rs).then(monster => SetMonster(monster))
  })
});

chrome.alarms.onAlarm.addListener(() => {
  GetMonster().then((rs: MonsterModel) => {
    MonsterFactory(rs).then(monster => {
      monster.Exp = new Date().getTime() - new Date(monster.DateOfBirth).getTime()
      UpdateMonster(monster)
        .then(monster => SetMonster(monster)
          .then(rs => UpdateBadge(rs)))
    });
  });
})

function UpdateBadge(monster: MonsterModel) {
    chrome.action.setBadgeText({ text: FormatDuration(monster.Exp) })
    const color = Constants.BadgeColor[monster.Type] ?? '#aaaaaa'
    chrome.action.setBadgeBackgroundColor({ color })
}
