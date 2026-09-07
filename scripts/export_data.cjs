/**
 * 导出脚本：把 wechat_ticker 小程序软考学习模块的题库导出为本站静态 JSON
 * 数据源（均为 CommonJS module.exports，可直接 require）：
 *   /d/code/wechat_ticker/utils/learn_data.js   AI 生成题 (id<1000, 含 case)
 *   /d/code/wechat_ticker/utils/rk_questions.js 历年真题 (id>=1000)
 *   /d/code/wechat_ticker/utils/flashcards.js    速记卡片
 * 输出：data/questions.json / data/flashcards.json
 * 用法：node scripts/export_data.cjs
 */
const fs = require('fs')
const path = require('path')

const SRC = 'D:/code/wechat_ticker/utils'
const OUT = path.join(__dirname, '..', 'data')

const genQuestions = require(path.join(SRC, 'learn_data.js'))
const rkQuestions = require(path.join(SRC, 'rk_questions.js'))
const flashcards = require(path.join(SRC, 'flashcards.js'))

const questions = [...genQuestions, ...rkQuestions]

function pick(q) {
  const out = {}
  for (const k of ['id', 'category', 'questionType', 'source', 'question', 'options', 'answerIndex', 'explanation', 'context', 'subQuestions', 'tag']) {
    if (q[k] !== undefined) out[k] = q[k]
  }
  return out
}

const cleaned = questions.map(pick)
const cards = flashcards.map(pick)

fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'questions.json'), JSON.stringify(cleaned))
fs.writeFileSync(path.join(OUT, 'flashcards.json'), JSON.stringify(cards))

const choice = cleaned.filter(q => q.questionType !== 'case')
const cases = cleaned.filter(q => q.questionType === 'case')
const catCount = {}
for (const q of choice) catCount[q.category] = (catCount[q.category] || 0) + 1
const cardTags = {}
for (const c of cards) cardTags[c.tag] = (cardTags[c.tag] || 0) + 1

console.log('== 导出完成 ==')
console.log('选择题/单题:', choice.length, '| 案例分析:', cases.length, '| 合计:', cleaned.length)
console.log('速记卡片:', cards.length)
console.log('\n== 分类分布 (choice) ==')
for (const [k, v] of Object.entries(catCount)) console.log(' ', k, v)
console.log('\n== 卡片 tag 分布 ==')
for (const [k, v] of Object.entries(cardTags)) console.log(' ', k, v)
console.log('\n== 真题来源示例 (id>=1000, 前5) ==')
for (const q of cleaned.filter(q => q.id >= 1000).slice(0, 5)) console.log(' ', q.id, q.source, '|', q.category)
console.log('\n== case 示例 (前3) ==')
for (const q of cases.slice(0, 3)) {
  console.log(' ', q.id, q.category, '| 子题数:', (q.subQuestions || []).length)
}
