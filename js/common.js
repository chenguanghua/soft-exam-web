/**
 * common.js — 通用小工具（无 DOM 级框架依赖）
 */
const $ = (sel, el) => (el || document).querySelector(sel)
const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel))
const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// 简略版：题目内可能含 <br> 之类的换行，先转义再还原受控白名单
function rich(s) {
  return esc(s).replace(/\n/g, '<br>')
}

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

let toastTimer = null
function toast(msg) {
  const t = $('#toast')
  if (!t) return
  t.textContent = msg
  t.hidden = false
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { t.hidden = true }, 1800)
}

function pct(a, b) {
  if (!b) return 0
  return Math.round((a / b) * 100)
}

function progressBar(cur, total, extraClass) {
  return `<div class="progress ${extraClass || ''}"><i style="width:${Math.min(100, pct(cur, total))}%"></i></div>`
}
