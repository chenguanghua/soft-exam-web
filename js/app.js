/**
 * app.js — 应用入口：路由、主题、全局事件
 */
const App = {
  current: 'dash',

  registry: {
    dash: { render: () => Dash.render(), onEvent: (e) => Dash.onEvent(e) },
    quiz: { render: () => Quiz.route(), onEvent: (e) => Quiz.onEvent(e) },
    case: { render: () => CaseV.route(), onEvent: (e) => CaseV.onEvent(e) },
    cards: { render: () => CardsV.route(), onEvent: (e) => CardsV.onEvent(e) },
    wrong: { render: () => WrongV.route(), onEvent: (e) => WrongV.onEvent(e) }
  },

  go(view) {
    if (!this.registry[view]) view = 'dash'
    if (location.hash !== '#' + view) {
      try { history.pushState(null, '', '#' + view) } catch (e) { location.hash = view }
    }
    this.render(view)
  },

  render(view) {
    this.current = view
    Store.setLastView(view)
    this.registry[view].render()
    this.highlightNav(view)
    window.scrollTo(0, 0)
  },

  highlightNav(view) {
    $$('#nav .nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view))
  },

  refreshBadge() {
    const n = Store.getWrong().length
    const b = $('#wrongBadge')
    if (!b) return
    b.hidden = n === 0
    b.textContent = n
  },

  // ---------- 主题 ----------
  applyTheme() {
    let t = Store.getTheme()
    if (t === 'auto') t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.dataset.theme = t
    const btn = $('#themeBtn')
    if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙'
  },

  toggleTheme() {
    const cur = document.documentElement.dataset.theme
    const next = cur === 'dark' ? 'light' : 'dark'
    Store.setTheme(next)
    this.applyTheme()
  },

  boot() {
    // 主题
    this.applyTheme()
    $('#themeBtn').addEventListener('click', () => this.toggleTheme())

    // 顶部导航
    $$('#nav .nav-btn').forEach(b => b.addEventListener('click', () => this.go(b.dataset.view)))

    // 视图内点击事件代理
    $('#view').addEventListener('click', (e) => {
      const v = this.registry[this.current]
      if (v && v.onEvent) v.onEvent(e)
    })

    // 浏览器前进/后退
    window.addEventListener('popstate', () => this.render(this.viewFromHash()))

    // 加载题库
    $('#bootLoading').textContent = '正在加载题库…'
    Data.load().then(() => {
      $('#bootLoading').style.display = 'none'
      this.render(this.viewFromHash())
      this.refreshBadge()
    }).catch(err => {
      $('#bootLoading').innerHTML = `<div style="color:var(--bad)">题库加载失败：${esc(err.message)}<br><br>请确认通过本地 HTTP 服务器或 GitHub Pages 访问（直接双击文件打开会被浏览器拦截）。</div>`
    })
  },

  viewFromHash() {
    const h = location.hash.replace('#', '')
    return this.registry[h] ? h : Store.getLastView()
  }
}

// 由 viewFromHash 判断（无 hash 时恢复上次视图，未加载完成前的默认 fallback）
window.addEventListener('DOMContentLoaded', () => App.boot())
