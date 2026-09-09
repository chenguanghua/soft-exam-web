/**
 * data.js — 题库加载与查询
 * questions.json 结构：
 *   choice: {id, category, source?, question, options, answerIndex, explanation}
 *   case:   {id, category, questionType:'case', context, subQuestions:[{question,answer}], explanation?}
 */
const Data = (() => {
  let QUESTIONS = []
  let FLASHCARDS = []
  let QUESTION_MAP = new Map()
  let FLASHCARD_MAP = new Map()
  let READY = false

  // 范围：all=全部单题 real=历年真题(id>=1000) ai=AI精炼(id<1000) explain=高频精讲(id>=2000)
  const SCOPES = [
    { id: 'all', name: '全部' },
    { id: 'real', name: '历年真题' },
    { id: 'ai', name: 'AI 精炼' },
    { id: 'explain', name: '高频精讲' }
  ]

  async function load() {
    const [qs, cs, extraQs, extraCs] = await Promise.all([
      fetch('data/questions.json').then(r => { if (!r.ok) throw new Error('questions.json ' + r.status); return r.json() }),
      fetch('data/flashcards.json').then(r => { if (!r.ok) throw new Error('flashcards.json ' + r.status); return r.json() }),
      fetch('data/extra_questions.json').then(r => { if (!r.ok) throw new Error('extra_questions.json ' + r.status); return r.json() }),
      fetch('data/extra_flashcards.json').then(r => { if (!r.ok) throw new Error('extra_flashcards.json ' + r.status); return r.json() })
    ])
    // 合并题库和速记卡片
    QUESTIONS = [...qs, ...extraQs]
    FLASHCARDS = [...cs, ...extraCs]

    // 构建 Map 缓存，O(1) 查找
    QUESTION_MAP = new Map(QUESTIONS.map(q => [q.id, q]))
    FLASHCARD_MAP = new Map(FLASHCARDS.map(c => [String(c.id), c]))

    READY = true
    return true
  }

  const isReady = () => READY

  // 全部单题（不含案例分析）
  function single() { return QUESTIONS.filter(q => q.questionType !== 'case') }
  function cases() { return QUESTIONS.filter(q => q.questionType === 'case') }

  // 分类统计（仅单题），顺序固定来自题库源顺序
  const categories = () => {
    const m = new Map()
    for (const q of single()) {
      if (!m.has(q.category)) m.set(q.category, { name: q.category, total: 0 })
      m.get(q.category).total++
    }
    return [...m.values()]
  }

  const caseCategories = () => {
    const m = new Map()
    for (const q of cases()) {
      if (!m.has(q.category)) m.set(q.category, { name: q.category, total: 0 })
      m.get(q.category).total++
    }
    return [...m.values()]
  }

  // 按 范围+分类 过滤单题（保持源顺序）
  function list(scope, cat) {
    return single().filter(q => {
      if (scope === 'real' && q.id < 1000) return false
      if (scope === 'ai' && q.id >= 1000) return false
      if (scope === 'explain' && q.id < 2000) return false
      if (cat && cat !== '全部' && q.category !== cat) return false
      return true
    })
  }

  const byId = (id) => QUESTION_MAP.get(id)
  const cardById = (id) => FLASHCARD_MAP.get(String(id))
  const totalSingle = () => single().length

  return { load, isReady, categories, caseCategories, list, cases, byId, cardById, totalSingle, SCOPES, flashcards: () => FLASHCARDS }
})()
