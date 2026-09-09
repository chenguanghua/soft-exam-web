/**
 * wrong.js — 错题本：列表管理，一键重练
 */
const WrongV = {
  route() {
    const ids = Store.getWrong()
    const qs = ids.map(id => Data.byId(id)).filter(Boolean)
    if (!qs.length) {
      $('#view').innerHTML = `
        <h1 class="page-title">错题本</h1>
        <div class="card empty" style="margin-top:14px">
          <div class="big">🎉</div>
          <div>暂无错题，继续保持</div>
          <div class="actions" style="justify-content:center">
            <button class="btn btn-primary" data-action="go-quiz">去刷题</button>
          </div>
        </div>
      `
      return
    }
    const items = qs.map((q, i) => `
      <div class="wrong-item" data-action="practice-at" data-idx="${i}">
        <span class="wi-idx">${i + 1}</span>
        <div class="wi-q">${esc(String(q.question).slice(0, 90))}${q.question.length > 90 ? '…' : ''}
          <small>${esc(q.category)} ${q.source ? '· ' + esc(q.source) : ''} · 答错 ${wrongCountOf(q.id)} 次 / 共答 ${totalCountOf(q.id)} 次</small>
        </div>
        <button class="btn btn-sm btn-danger" data-action="rm-one" data-id="${q.id}" title="移出错题本">移除</button>
      </div>`).join('')

    $('#view').innerHTML = `
      <h1 class="page-title">错题本</h1>
      <p class="page-sub">共 ${qs.length} 题 · 重练时答对会自动移出 · 答题记录仅存本机</p>
      <div class="card" style="padding:12px 18px">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">
          <button class="btn btn-primary" data-action="practice-all">全部重练（${qs.length}）</button>
          <button class="btn btn-danger" data-action="clear-all">清空错题本</button>
        </div>
        <div style="margin-top:6px">${items}</div>
      </div>
    `
  },

  onEvent(e) {
    const t = e.target.closest('[data-action]')
    if (!t) return
    const a = t.dataset.action
    if (a === 'go-quiz') { App.go('quiz'); return }
    if (a === 'practice-all') { Quiz.startWrong(0); return }
    if (a === 'practice-at') { Quiz.startWrong(Number(t.dataset.idx)); return }
    if (a === 'rm-one') {
      Store.wrongRemove(Number(t.dataset.id))
      toast('已移除')
      this.route()
      App.refreshBadge()
      return
    }
    if (a === 'clear-all') {
      if (confirm('确定清空全部错题记录？此操作不可恢复。')) {
        Store.wrongClear()
        toast('已清空')
        this.route()
        App.refreshBadge()
      }
    }
  }
}

function wrongCountOf(qid) {
  const a = Store.getAnswers()[qid]
  return a ? (a.n - a.o) : 1
}

function totalCountOf(qid) {
  const a = Store.getAnswers()[qid]
  return a ? a.n : 1
}
