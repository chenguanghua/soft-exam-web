/**
 * dash.js — 仪表盘视图：总览统计 + 分类进度 + 快捷入口
 */
const Dash = {
  render() {
    const cats = Data.categories()
    const answers = Store.getAnswers()
    const qids = new Set(Object.keys(answers))
    const byCat = {}
    for (const c of cats) byCat[c.name] = { answered: 0, ok: 0, n: 0 }

    let okSum = 0, nSum = 0, answeredTotal = 0, realAnswered = 0, aiAnswered = 0
    for (const [qid, rec] of Object.entries(answers)) {
      const q = Data.byId(Number(qid))
      if (!q || q.questionType === 'case') continue
      answeredTotal++
      okSum += rec.o; nSum += rec.n
      if (q.id >= 1000) realAnswered++; else aiAnswered++
      if (byCat[q.category]) { byCat[q.category].answered++; byCat[q.category].ok += rec.o; byCat[q.category].n += rec.n }
    }
    const acc = nSum ? Math.round((okSum / nSum) * 100) : 0
    const wrongIds = Store.getWrong()
    const caseN = Object.keys(Store.caseDone()).length
    const knownN = Object.keys(Store.knownCards()).length
    const total = Data.totalSingle()
    const lastQuiz = Store.getLastQuiz()
    const wrongQs = wrongIds.length

    const catsHtml = cats.map(c => {
      const a = byCat[c.name] || { answered: 0, ok: 0, n: 0 }
      const cacc = a.n ? Math.round((a.ok / a.n) * 100) : null
      return `<div class="cat-item" data-cat="${esc(c.name)}" data-action="start-cat" title="继续练习「${esc(c.name)}」(${a.answered}/${c.total} 已刷)">
        <div class="cat-name">${esc(c.name)} <span class="tag">${c.total} 题</span></div>
        <div class="cat-pct">${a.answered}/${c.total}${cacc !== null ? ` · 正确率 ${cacc}%` : ''}</div>
        <div class="progress"><i style="width:${pct(a.answered, c.total)}%"></i></div>
      </div>`
    }).join('')

    const lastBtn = lastQuiz
      ? `<button class="btn btn-primary" data-action="continue-last">继续上次：${esc(scopeName(lastQuiz.scope))} / ${esc(lastQuiz.cat)}</button>`
      : ''

    $('#view').innerHTML = `
      <h1 class="page-title">仪表盘</h1>
      <p class="page-sub">软考中级（软件设计师）· 题库 ${total} 单题 + ${Data.cases().length} 案例分析 + ${Data.flashcards().length} 速记卡片 · 数据与进度均保存在本机浏览器</p>

      <div class="grid grid-4">
        <div class="stat brand-t"><div class="num brand">${answeredTotal}<small> / ${total}</small></div><div class="lbl">单题已刷 · 总正确率 ${acc}%</div></div>
        <div class="stat ok-t"><div class="num ok">${caseN}<small> / ${Data.cases().length}</small></div><div class="lbl">案例分析已练</div></div>
        <div class="stat warn-t"><div class="num">${knownN}<small> / ${Data.flashcards().length}</small></div><div class="lbl">速记卡片已掌握</div></div>
        <div class="stat bad-t"><div class="num bad">${wrongQs}</div><div class="lbl">错题待复习</div></div>
      </div>

      <div class="card" style="margin-top:14px">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${lastBtn}
          <button class="btn" data-action="quick-random">随机热身 20 题</button>
          <button class="btn" data-action="real-mode">历年真题模式</button>
          <button class="btn" data-action="ai-mode">AI 精炼模式</button>
          <button class="btn" data-action="wrong-practice" ${wrongQs ? '' : 'disabled'}>错题重练（${wrongQs}）</button>
          <button class="btn" data-action="case-mode">案例分析</button>
        </div>
        <div style="margin-top:12px;display:flex;gap:18px;font-size:12.5px;color:var(--text2)">
          <span>真题已刷 <b>${realAnswered}</b> · AI 已刷 <b>${aiAnswered}</b></span>
        </div>
      </div>

      <h2 style="font-size:16px;margin:20px 0 4px">分类练习进度</h2>
      <div class="card" style="padding:10px 16px">${catsHtml || '<div class="empty">暂无分类</div>'}</div>
    `
  },

  onEvent(e) {
    const t = e.target.closest('[data-action], [data-cat]')
    if (!t) return
    const action = t.dataset.action || t.dataset.action
    if (t.dataset.action) {
      const a = t.dataset.action
      if (a === 'start-cat') { Quiz.start({ scope: 'all', cat: t.dataset.cat, resume: true }) }
      else if (a === 'continue-last') { const l = Store.getLastQuiz(); if (l) Quiz.start({ scope: l.scope, cat: l.cat, resume: true }) }
      else if (a === 'quick-random') { Quiz.start({ scope: 'all', cat: '全部', randomCount: 20 }) }
      else if (a === 'real-mode') { Quiz.start({ scope: 'real', cat: '全部' }) }
      else if (a === 'ai-mode') { Quiz.start({ scope: 'ai', cat: '全部' }) }
      else if (a === 'wrong-practice') { Quiz.startWrong() }
      else if (a === 'case-mode') { App.go('case') }
      return
    }
    if (t.dataset.cat) Quiz.start({ scope: 'all', cat: t.dataset.cat, resume: true })
  }
}

function scopeName(id) {
  const s = Data.SCOPES.find(x => x.id === id)
  return s ? s.name : '全部'
}
