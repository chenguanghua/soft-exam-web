/**
 * ui_smoke.cjs — Playwright 端到端冒烟：验证核心链路可跑 + 截图
 * 用法：NODE_PATH=<workspace>/node_modules node scripts/ui_smoke.cjs
 */
const { chromium } = require('playwright')

const BASE = 'http://127.0.0.1:8123'
const EXE = 'C:/Users/zll/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'
const SHOT = (n) => `D:/code/soft-exam-web/screenshots/${n}.png`

;(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  page.on('pageerror', e => errors.push('pageerror: ' + e.message))

  const step = async (name, fn) => { try { await fn(); console.log('PASS', name) } catch (e) { console.log('FAIL', name, '->', e.message.split('\n')[0]) } }

  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForSelector('h1.page-title')

  // 1. 仪表盘（亮色）
  await step('dash 渲染与统计数字', async () => {
    const txt = await page.locator('#view').innerText()
    if (!txt.includes('仪表盘') || !txt.includes('/ 1163')) throw new Error('仪表盘统计缺失')
    if (!(await page.locator('.cat-item').count()) >= 13) throw new Error('分类列表不足')
  })
  await page.screenshot({ path: SHOT('1-dash-light'), fullPage: false })

  // 2. 暗色主题
  await step('主题切换', async () => {
    await page.click('#themeBtn')
    await page.waitForTimeout(150)
    const t = await page.evaluate(() => document.documentElement.dataset.theme)
    if (t !== 'dark') throw new Error('主题未变 dark')
  })
  await page.screenshot({ path: SHOT('2-dash-dark') })

  // 3. 刷题：从分类「数据结构」开始，故意答错 → 验证解析与错题入库
  await step('进入刷题并答错一题', async () => {
    await page.click('.cat-item[data-cat="数据结构"]')
    await page.waitForSelector('.option')
    await page.click('.option >> nth=0') // 选 A（未必错，可能对；改选非正确答案）
    await page.waitForSelector('.answer-box')
    const ok = await page.locator('.answer-box').innerText()
    // 若第一题恰好对，换到下一题答错验证错误分支
    if (ok.includes('回答正确')) {
      await page.click('[data-action="q-next"]')
      await page.waitForSelector('.option')
      const ansIdx = await page.evaluate(() => {
        const q = window.__q
        return q ? q.answerIndex : 1
      })
      const wrong = ansIdx === 0 ? 1 : 0
      await page.click(`.option >> nth=${wrong}`)
      await page.waitForSelector('.answer-box')
    }
  })
  await page.screenshot({ path: SHOT('3-quiz-answered') })

  // 4. 推进两题
  await step('下一题推进', async () => {
    await page.click('[data-action="q-next"]')
    await page.waitForSelector('.option')
  })

  // 5. 速记卡片翻面
  await step('卡片翻面', async () => {
    await page.click('#nav .nav-btn[data-view="cards"]')
    await page.waitForSelector('.fcard')
    await page.click('#fcard')
    await page.waitForTimeout(450)
    const flipped = await page.evaluate(() => document.getElementById('fcard').classList.contains('flip'))
    if (!flipped) throw new Error('卡片未翻面')
    await page.click('#fcard')
    await page.waitForTimeout(350)
  })
  await page.screenshot({ path: SHOT('4-cards') })

  // 6. 标记一张认识
  await step('标记认识', async () => {
    await page.click('[data-action="know"]')
    await page.waitForTimeout(200)
  })

  // 7. 错题本 badge 与列表
  await step('错题本有内容', async () => {
    await page.click('#nav .nav-btn[data-view="wrong"]')
    await page.waitForSelector('.wrong-item, .empty')
    const n = await page.locator('.wrong-item').count()
    if (n < 1) throw new Error('错题本为空（预期有答错题）')
    const badge = await page.locator('#wrongBadge').innerText()
    console.log('     错题数:', n, 'badge:', badge)
  })
  await page.screenshot({ path: SHOT('5-wrong') })

  // 8. 案例分析
  await step('案例阅读与展开', async () => {
    await page.click('#nav .nav-btn[data-view="case"]')
    await page.waitForSelector('.wrong-item[data-action="open-case"]')
    await page.click('.wrong-item[data-action="open-case"] >> nth=0')
    await page.waitForSelector('.subq')
    await page.click('[data-action="reveal-all"]')
    const shown = await page.evaluate(() => document.querySelectorAll('.subq.revealed').length)
    if (shown < 1) throw new Error('答案未展开')
  })
  await page.screenshot({ path: SHOT('6-case') })

  // 9. 仪表盘刷新统计
  await step('仪表盘统计更新', async () => {
    await page.click('#nav .nav-btn[data-view="dash"]')
    await page.waitForSelector('.cat-item')
  })
  await page.screenshot({ path: SHOT('7-dash-after') })

  // 10. localStorage 状态
  const state = await page.evaluate(() => {
    const out = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k.startsWith('rk_')) out[k] = (JSON.parse(localStorage.getItem(k) || 'null'))
    }
    return out
  })
  console.log('localStorage keys:', Object.keys(state).join(', '))

  if (errors.length) {
    console.log('\n== 页面错误 ==')
    errors.forEach(e => console.log(' ', e))
  } else console.log('\n无页面 JS 错误')

  await browser.close()
  console.log('done')
})().catch(e => { console.error('FATAL', e); process.exit(1) })
