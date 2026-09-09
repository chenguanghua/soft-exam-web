/**
 * cards.js — 速记卡片：翻面记忆，认识/不认识打标
 */
const CardsV = {
  state: null, // { list, idx, filter }

  route() {
    if (!this.state) this.state = this._newState('all', 0)
    const s = this.state
    if (s.list.length && s.idx < s.list.length) this.renderCard()
    else this.renderEmpty()
  },

  _newState(filter, startIdx) {
    const all = Data.flashcards()
    const known = Store.knownCards()
    let list
    if (filter === 'new') list = all.filter(c => !known[String(c.id)])
    else if (filter === 'known') list = all.filter(c => known[String(c.id)])
    else list = all.slice()
    const idx = Math.min(startIdx, Math.max(0, list.length - 1))
    return { list, idx, filter }
  },

  _knownSet() {
    return new Set(Object.keys(Store.knownCards()))
  },

  renderCard() {
    this._renderCardInternal()
  },

  _renderCardInternal() {
    const s = this.state
    const c = s.list[s.idx]
    const knownAll = this._knownSet()
    const known = knownAll.has(String(c.id))
    const knownN = Data.flashcards().filter(x => knownAll.has(String(x.id))).length

    $('#view').innerHTML = `
      <h1 class="page-title">速记卡片</h1>
      <p class="page-sub">高频必背：排序复杂度、设计模式、协议端口、范式、案例答题模板等</p>

      <div class="card" style="display:flex;flex-direction:column;align-items:center">
        <div class="chip-row" style="margin-bottom:16px">
          <button class="chip ${s.filter === 'all' ? 'active' : ''}" data-action="f-all">全部 ${Data.flashcards().length}</button>
          <button class="chip ${s.filter === 'new' ? 'active' : ''}" data-action="f-new">未掌握 ${Data.flashcards().length - knownN}</button>
          <button class="chip ${s.filter === 'known' ? 'active' : ''}" data-action="f-known">已掌握 ${knownN}</button>
          <button class="chip" data-action="shuffle">随机抽卡</button>
        </div>

        <div class="progress-pos small muted" style="margin-bottom:10px">${s.idx + 1} / ${s.list.length} · 已掌握 ${knownN}/${Data.flashcards().length}</div>
        <div class="progress" style="width:100%;max-width:680px;margin-bottom:14px"><i style="width:${pct(s.idx + 1, s.list.length)}%"></i></div>

        <div class="card3d">
          <div class="fcard" id="fcard" data-action="flip-card">
            <div class="face front">
              <span class="hint">${esc(c.tag || '速记')} · 点击卡片翻面</span>
              <div>${rich(c.question)}</div>
            </div>
            <div class="face back">
              <div>${rich(c.answer || '暂无解析，请参考教材相关章节')}</div>
              <span class="hint">点击卡片翻回</span>
            </div>
          </div>
        </div>

        <div class="card-controls">
          <button class="btn btn-sm" data-action="prev" ${s.idx === 0 ? 'disabled' : ''}>‹ 上一张</button>
          <button class="btn ${known ? '' : 'btn-primary'}" data-action="know">${known ? '已掌握 ✓' : '认识，记住了'}</button>
          <button class="btn btn-ghost" data-action="next">下一张 →</button>
          <button class="btn btn-ghost" data-action="again" ${s.filter === 'new' ? 'disabled' : ''}>重学模式</button>
        </div>
        <div class="small muted" style="margin-top:10px">“认识”会记录掌握状态；“重学模式”只浏览不改变记录</div>
      </div>
    `
  },

  renderEmpty() {
    $('#view').innerHTML = `
      <h1 class="page-title">速记卡片</h1>
      <div class="card empty" style="margin-top:14px">
        <div>该分组没有卡片</div>
        <div class="actions" style="justify-content:center">
          <button class="btn" data-action="f-all">看全部</button>
          <button class="btn" data-action="f-new">只看未掌握</button>
        </div>
      </div>
    `
  },

  _go(delta) {
    const s = this.state
    if (!s.list.length) return
    const n = s.list.length
    s.idx = ((s.idx + delta) % n + n) % n
    if (s.filter === 'all') Store.cardPosSet(s.idx)
    this._renderCardInternal()
  },

  onEvent(e) {
    const t = e.target.closest('[data-action]')
    if (!t) return
    const a = t.dataset.action
    const s = this.state
    if (a === 'flip-card') { t.classList.toggle('flip'); return }
    if (a === 'f-all') { this.state = this._newState('all', Store.cardPosGet()); this._renderCardInternal(); return }
    if (a === 'f-new') { this.state = this._newState('new', 0); this._renderCardInternal(); return }
    if (a === 'f-known') { this.state = this._newState('known', 0); this._renderCardInternal(); return }
    if (a === 'shuffle') { const list = shuffle(Data.flashcards()); this.state = { list, idx: 0, filter: s.filter }; this._renderCardInternal(); return }
    if (a === 'next') { this._go(1); return }
    if (a === 'prev') { this._go(-1); return }
    if (a === 'know') {
      const c = s.list[s.idx]
      Store.cardKnown(c.id)
      toast('已标记掌握')
      if (s.filter === 'new' && s.idx >= s.list.length - 1) { this._renderCardInternal(); return }
      this._go(1)
      return
    }
    if (a === 'again') { this.state = this._newState('all', Store.cardPosGet()); toast('进入浏览模式，不改变记录'); this._renderCardInternal(); return }
  }
}
