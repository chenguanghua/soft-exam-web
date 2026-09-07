/**
 * quiz.js — 刷题引擎：顺序练习 / 随机热身 / 真题·AI模式 / 错题重练
 * 状态机：pick（选择屏）→ session（答题流）→ done（本次统计）
 */
const Quiz = {
  state: null, // { mode, list, idx, okN, nN, scope, cat, wrong:bool, random:bool, done:bool }

  // ============ 入口 ============
  start({ scope = 'all', cat = '全部', resume = false, randomCount = 0 } = {}) {
    let list = Data.list(scope, cat)
    if (!list.length) { toast('该分类暂无题目'); return }
    if (randomCount) { list = shuffle(list).slice(0, randomCount); resume = false }
    const key = scope + '|' + cat
    let idx = 0
    if (resume) idx = Math.min(Store.progressGet(key), list.length - 1)
    Store.setLastQuiz({ scope, cat, ts: Date.now() })
    this.state = { mode: 'session', list, idx, okN: 0, nN: 0, scope, cat, wrong: false, random: !!randomCount, key, done: false }
    App.go('quiz')
    this.renderQuestion()
  },

  startWrong(idx = 0) {
    const ids = Store.getWrong()
    const list = ids.map(id => Data.byId(id)).filter(q => q && q.questionType !== 'case')
    if (!list.length) { toast('错题本是空的，先去刷题吧'); return }
    idx = Math.min(idx, Math.max(0, list.length - 1))
    this.state = { mode: 'session', list, idx, okN: 0, nN: 0, scope: 'all', cat: '错题本', wrong: true, random: false, key: '__wrong', done: false }
    App.go('quiz')
    this.renderQuestion()
  },

  // 从导航进入：有进行中的会话则续答，否则显示选择屏
  route() {
    const s = this.state
    if (s && s.mode === 'session') {
      if (s.done) { this.state = { mode: 'pick', selScope: 'all', selCat: '全部' }; this.renderPick() }
      else this.renderQuestion()
      return
    }
    if (!s) {
      const l = Store.getLastQuiz() || { scope: 'all', cat: '全部' }
      this.state = { mode: 'pick', selScope: l.scope || 'all', selCat: l.cat || '全部' }
    }
    this.renderPick()
  },

  // ============ 选择屏 ============
  renderPick() {
    const cats = Data.categories()
    const scopes = Data.SCOPES
    const selScope = (this.state && this.state.mode === 'pick' && this.state.selScope) || 'all'
    const selCat = (this.state && this.state.mode === 'pick' && this.state.selCat) || '全部'
    const countOf = (s, c) => Data.list(s, c).length
    const cnt = countOf(selScope, selCat)

    $('#view').innerHTML = `
      <h1 class="page-title">刷题练习</h1>
      <p class="page-sub">先选范围与分类，可随时退出，进度自动保存</p>

      <div class="card">
        <div class="chip-row" style="margin-bottom:12px">
          <span class="grp-label">范围</span>
          ${scopes.map(s => `<button class="chip ${s.id === selScope ? 'active' : ''}" data-action="pick-scope" data-scope="${s.id}">${s.name} · ${countOf(s.id, selCat)}</button>`).join('')}
        </div>
        <div class="chip-row">
          <span class="grp-label">分类</span>
          <button class="chip ${selCat === '全部' ? 'active' : ''}" data-action="pick-cat" data-cat="全部">全部 · ${countOf(selScope, '全部')}</button>
          ${cats.map(c => `<button class="chip ${selCat === c.name ? 'active' : ''}" data-action="pick-cat" data-cat="${esc(c.name)}">${esc(c.name)} · ${c.total}</button>`).join('')}
        </div>
        <div style="margin-top:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-primary" data-action="quiz-start" data-start="resume">开始练习（继续上次）</button>
          <button class="btn" data-action="quiz-start" data-start="fresh">从头开始</button>
          <span class="small muted">当前共 <b>${cnt}</b> 题 · 随机跳题与乱序可在答题页进行</span>
        </div>
      </div>
    `
  },

  // ============ 答题流 ============
  renderQuestion() {
    const s = this.state
    if (!s || s.mode !== 'session') return
    if (s.idx >= s.list.length) return this.renderDone()

    const q = s.list[s.idx]
    const answered = s.answeredId === q.id
    const pos = s.done ? s.list.length : Math.min(s.idx + 1, s.list.length)
    const labels = q.options.map((_, i) => LABELS[i] || String(i))
    const isLast = s.idx === s.list.length - 1
    const acc = s.nN ? Math.round((s.okN / s.nN) * 100) : '–'

    let optionsHtml = q.options.map((opt, i) => {
      let cls = 'option'
      if (answered) {
        if (i === q.answerIndex) cls += ' ok'
        else if (i === s.selectedIdx) cls += ' bad'
      } else if (i === s.selectedIdx) cls += ' sel'
      return `<button class="${cls}" data-action="option" data-idx="${i}" ${answered ? 'disabled' : ''}>
        <span class="opt-key">${labels[i]}</span><span>${rich(opt)}</span>
      </button>`
    }).join('')

    let answerHtml = ''
    if (answered) {
      const isOk = s.selectedIdx === q.answerIndex
      answerHtml = `
        <div class="answer-box" style="margin-top:4px">
          ${isOk
            ? `<span style="font-weight:700;color:var(--ok)">回答正确</span> · 正确答案 ${labels[q.answerIndex]}`
            : `<span style="font-weight:700;color:var(--bad)">回答错误</span> · 正确答案 ${labels[q.answerIndex]}（你选了 ${labels[s.selectedIdx]}）`}
        </div>
        ${q.explanation ? `<div class="explanation">${rich(q.explanation)}</div>` : ''}`
    }

    $('#view').innerHTML = `
      <div class="quiz-head">
        <div>
          <button class="btn btn-sm btn-ghost" data-action="q-quit">‹ 返回</button>
          <span class="tag" style="margin-left:8px">${esc(titleOf(s))}</span>
          ${q.source ? `<span class="tag" style="margin-left:6px">${esc(q.source)}</span>` : ''}
        </div>
        <div class="progress-pos">${pos} / ${s.list.length} · 本次答对 <b>${s.okN}</b> / ${s.nN}（${acc}%）</div>
      </div>
      <div class="progress" style="margin:4px 0 14px"><i style="width:${pct(pos, s.list.length)}%"></i></div>

      <div class="card">
        <div class="q-title">${rich(q.question)}</div>
        <div class="options">${optionsHtml}</div>
        ${answerHtml}
        <div class="actions">
          ${answered ? `<button class="btn btn-primary" data-action="q-next">${isLast ? '查看本次统计' : '下一题 →'}</button>` : ''}
        </div>
      </div>
    `
  },

  answer(idx) {
    const s = this.state
    const q = s.list[s.idx]
    if (s.answeredId === q.id) return
    const ok = idx === q.answerIndex
    s.okN += ok ? 1 : 0
    s.nN += 1
    s.selectedIdx = idx
    s.answeredId = q.id
    Store.record(q.id, ok)
    if (!ok) Store.wrongAdd(q.id)
    else if (s.wrong) Store.wrongRemove(q.id) // 错题重练：答对即移出错题本
    if (!s.random && !s.wrong) Store.progressSet(s.key, s.idx + 1)
    this.renderQuestion()
    App.refreshBadge()
  },

  next() {
    const s = this.state
    if (s.idx + 1 >= s.list.length) { s.done = true; this.renderDone(); return }
    s.idx += 1
    delete s.answeredId
    delete s.selectedIdx
    this.renderQuestion()
  },

  quitToPick() {
    this.state = { mode: 'pick', selScope: 'all', selCat: '全部' }
    this.renderPick()
  },

  // ============ 结束统计 ============
  renderDone() {
    const s = this.state
    const acc = s.nN ? Math.round((s.okN / s.nN) * 100) : 0
    const btn = s.wrong
      ? { label: '继续重练错题', act: 'replay' }
      : { label: '再来一组', act: 'replay' }
    const wrongLeft = Store.getWrong().length

    $('#view').innerHTML = `
      <div class="card session-done">
        <div class="big ${acc >= 60 ? 'num ok' : 'num bad'}">${acc}%</div>
        <div class="small dim-sum">本次共答 ${s.nN} 题 · 答对 ${s.okN} 题</div>
        ${s.wrong
          ? `<p class="muted" style="margin:12px 0 0">本次答对的错题已自动移出错题本${wrongLeft ? `，剩余 ${wrongLeft} 题待复习` : '，错题本已清空'}</p>`
          : `<p class="muted" style="margin:12px 0 0">${s.random ? '随机热身完成' : `已保存「${titleOf(s)}」进度，下次可继续`}</p>`}
        <div class="actions" style="justify-content:center">
          <button class="btn btn-primary" data-action="done-replay">${btn.label}</button>
          <button class="btn" data-action="q-quit">返回选择</button>
          <button class="btn" data-action="done-dash">回仪表盘</button>
        </div>
      </div>
    `
  },

  replay() {
    const s = this.state
    if (s.wrong) { this.startWrong(); return }
    const cfg = { scope: s.scope, cat: s.cat }
    if (s.random) cfg.randomCount = s.list.length
    else cfg.resume = false
    this.start(cfg)
  },

  // ============ 事件 ============
  onEvent(e) {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const a = btn.dataset.action
    const s = this.state

    if (a === 'pick-scope') { s.selScope = btn.dataset.scope; this.renderPick(); return }
    if (a === 'pick-cat') { s.selCat = btn.dataset.cat; this.renderPick(); return }
    if (a === 'quiz-start') {
      const resume = btn.dataset.start === 'resume'
      const progress = Store.progressGet(s.selScope + '|' + s.selCat)
      this.start({ scope: s.selScope, cat: s.selCat, resume: resume && progress > 0 })
      return
    }
    if (a === 'option') { this.answer(Number(btn.dataset.idx)); return }
    if (a === 'q-next') { this.next(); return }
    if (a === 'q-quit') {
      if (s.mode === 'session' && !s.done) this.state = { mode: 'pick', selScope: 'all', selCat: '全部' }
      if (s && s.wrong) { App.go('wrong'); return }
      this.renderPick()
      return
    }
    if (a === 'done-replay') { this.replay(); return }
    if (a === 'done-dash') { App.go('dash'); return }
  }
}

function titleOf(s) {
  if (s.wrong) return '错题重练'
  if (s.cat !== '全部') return s.cat
  const sc = Data.SCOPES.find(x => x.id === s.scope)
  return (sc ? sc.name : '全部') + '题'
}
