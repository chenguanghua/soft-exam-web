/**
 * store.js — localStorage 封装
 * 所有数据仅存本机浏览器，不上传。
 * 键位：rk_wrong / rk_progress / rk_answers / rk_caseDone / rk_knownCards / rk_cardPos / rk_theme / rk_lastView / rk_version
 */
const Store = (() => {
  const P = 'rk_'
  const DATA_VERSION = 1

  const read = (k, def) => {
    try {
      const raw = localStorage.getItem(P + k)
      return raw === null ? def : JSON.parse(raw)
    } catch (e) { return def }
  }
  const write = (k, v) => {
    try { localStorage.setItem(P + k, JSON.stringify(v)) } catch (e) { /* 空间满时静默 */ }
  }
  const remove = (k) => { try { localStorage.removeItem(P + k) } catch (e) {} }

  // 数据版本迁移支持
  function migrate() {
    const currentVersion = read('version', 0)
    if (currentVersion >= DATA_VERSION) return

    // 未来版本迁移逻辑在此添加
    // if (currentVersion < 2) { ... }

    write('version', DATA_VERSION)
  }

  // 初始化时执行迁移
  migrate()

  const getWrong = () => read('wrong', [])
  const setWrong = (ids) => write('wrong', ids)
  const wrongAdd = (id) => {
    const w = getWrong()
    if (w.includes(id)) return
    w.push(id)
    setWrong(w)
  }
  const wrongRemove = (id) => setWrong(getWrong().filter(x => x !== id))
  const wrongClear = () => remove('wrong')

  // 答题记录 { qid: { o: 答对次数, n: 总答题次数 } }
  const record = (qid, ok) => {
    const a = read('answers', {})
    const cur = a[qid] || { o: 0, n: 0 }
    cur.n += 1
    cur.o += ok ? 1 : 0
    a[qid] = cur
    write('answers', a)
  }
  const getAnswers = () => read('answers', {})

  // 刷题进度 key -> 题序号
  const progressGet = (key) => read('progress', {})[key] || 0
  const progressSet = (key, idx) => { const p = read('progress', {}); p[key] = idx; write('progress', p) }

  const caseDone = () => read('caseDone', {})
  const caseMark = (id) => { const c = caseDone(); c[id] = Date.now(); write('caseDone', c) }

  const knownCards = () => read('knownCards', {})
  const cardKnown = (id) => { const c = knownCards(); c[id] = Date.now(); write('knownCards', c) }
  const cardResetKnown = () => remove('knownCards')
  const cardPosGet = () => read('cardPos', 0)
  const cardPosSet = (i) => write('cardPos', i)

  const getTheme = () => read('theme', 'auto')
  const setTheme = (t) => write('theme', t)
  const getLastView = () => read('lastView', 'dash')
  const setLastView = (v) => write('lastView', v)

  // 最近一次练习入口 {scope, cat}，用于首页“继续上次”
  const getLastQuiz = () => read('lastQuiz', null)
  const setLastQuiz = (v) => write('lastQuiz', v)

  return {
    getWrong, setWrong, wrongAdd, wrongRemove, wrongClear,
    record, getAnswers,
    progressGet, progressSet,
    caseDone, caseMark,
    knownCards, cardKnown, cardResetKnown, cardPosGet, cardPosSet,
    getTheme, setTheme, getLastView, setLastView,
    getLastQuiz, setLastQuiz
  }
})()
