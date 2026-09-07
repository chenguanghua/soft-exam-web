/**
 * case.js — 案例分析（软考下午题）阅读/自测
 */
const CaseV = {
  state: null, // { list, idx } 阅读流；null = 列表

  route() {
    if (this.state && this.state.idx < this.state.list.length) this.renderRead()
    else this.renderList()
  },

  renderList() {
    const cats = Data.caseCategories()
    const list = Data.cases()
    const done = Store.caseDone()

    const byCat = new Map()
    for (const q of list) {
      if (!byCat.has(q.category)) byCat.set(q.category, [])
      byCat.get(q.category).push(q)
    }

    const rows = [...byCat.entries()].map(([cat, qs]) => `
      <div style="margin-top:16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <h3 style="font-size:15px;margin:0">${esc(cat)}</h3>
          <span class="tag">${qs.length} 题</span>
          <span class="small muted">已练 ${qs.filter(q => done[q.id]).length}/${qs.length}</span>
        </div>
        ${qs.map(q => `
          <div class="wrong-item" data-action="open-case" data-id="${q.id}">
            <span class="wi-idx">#${q.id}</span>
            <div class="wi-q">${esc(String(q.context || q.question || '').slice(0, 110))}${(q.context || '').length > 110 ? '…' : ''}
              <small>${(q.subQuestions || []).length} 个子题 ${done[q.id] ? '· 已练 ✓' : ''}</small>
            </div>
          </div>`).join('')}
      </div>`).join('')

    const catsHtml = cats.length > 1
      ? `<div class="chip-row" style="margin-bottom:4px"><span class="grp-label">题型</span>
          ${cats.map(c => `<button class="chip" data-action="jump-cat" data-cat="${esc(c.name)}">${esc(c.name)}</button>`).join('')}
        </div>` : ''

    $('#view').innerHTML = `
      <h1 class="page-title">案例分析（下午题）</h1>
      <p class="page-sub">共 ${list.length} 题，覆盖数据流图 / 数据库 / UML / 数据结构 / 算法 / 通用模板。先读题自己作答，再逐条展开核对参考答案</p>
      ${catsHtml}
      <div class="card" style="padding:12px 18px">
        <div class="small muted" style="margin:4px 0 8px">已完成 ${Object.keys(done).length}/${list.length} · 建议结合「速记卡片 → 案例模板」背诵答题套路</div>
        ${rows || '<div class="empty">暂无案例题</div>'}
      </div>
    `
  },

  renderRead() {
    const s = this.state
    const q = s.list[s.idx]
    const done = !!Store.caseDone()[q.id]
    const subs = (q.subQuestions || []).map((sq, i) => `
      <div class="subq" data-subq="${i}">
        <div class="q">${i + 1}. ${esc(sq.question)}</div>
        <div class="a">${rich(sq.answer || '（无参考答案）')}</div>
      </div>`).join('')

    $('#view').innerHTML = `
      <div class="quiz-head">
        <div>
          <button class="btn btn-sm btn-ghost" data-action="case-back">‹ 返回列表</button>
          <span class="tag" style="margin-left:8px">${esc(q.category)}</span>
          ${q.source ? `<span class="tag" style="margin-left:6px">${esc(q.source)}</span>` : ''}
        </div>
        <div class="progress-pos">${s.idx + 1} / ${s.list.length}</div>
      </div>
      <div class="progress" style="margin:4px 0 14px"><i style="width:${pct(s.idx + 1, s.list.length)}%"></i></div>

      <div class="card">
        <div class="case-title">${rich(q.context || q.question)}</div>
        <div class="muted small" style="margin-bottom:4px">建议先自行作答，再逐条展开核对</div>
        ${subs}
        <div class="actions" style="justify-content:space-between">
          <div>
            <button class="btn btn-sm" data-action="reveal-one">逐条展开答案</button>
            <button class="btn btn-sm" data-action="reveal-all">全部展开</button>
            <button class="btn btn-sm ${done ? '' : 'btn-primary'}" data-action="mark-done">${done ? '已练 ✓' : '标记已练'}</button>
          </div>
          <div>
            ${s.idx < s.list.length - 1
              ? `<button class="btn btn-primary" data-action="case-next">下一题 →</button>`
              : `<button class="btn btn-primary" data-action="case-back">完成，返回列表</button>`}
          </div>
        </div>
      </div>
    `
  },

  openById(id) {
    const list = Data.cases()
    const idx = list.findIndex(q => q.id === id)
    if (idx < 0) return
    this.state = { list, idx }
    this.renderRead()
  },

  onEvent(e) {
    const t = e.target.closest('[data-action]')
    if (!t) return
    const a = t.dataset.action
    if (a === 'open-case') { this.openById(Number(t.dataset.id)); return }
    if (a === 'jump-cat') {
      const el = [...document.querySelectorAll('.wrong-item')].find(x => x.querySelector('.wi-q') && x.textContent.includes(t.dataset.cat))
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (a === 'case-back') { this.state = null; this.renderList(); return }
    if (a === 'case-next') {
      const s = this.state
      if (s.idx + 1 < s.list.length) { s.idx++; this.renderRead() }
      return
    }
    if (a === 'mark-done') {
      const q = this.state.list[this.state.idx]
      Store.caseMark(q.id)
      toast('已标记，继续保持')
      this.renderRead()
      return
    }
    if (a === 'reveal-one') {
      const subs = $$('.subq')
      const nxt = subs.find(x => !x.classList.contains('revealed'))
      if (nxt) nxt.classList.add('revealed')
      else $$('.subq').forEach(x => x.classList.add('revealed'))
      return
    }
    if (a === 'reveal-all') { $$('.subq').forEach(x => x.classList.add('revealed')) }
  }
}
