# 软考中级 · 软件设计师学习站

纯静态备考网站：**真题刷题 / 分类练习 / 速记卡片 / 案例分析 / 错题本**，零后端、零依赖、免服务器，可直接托管在 GitHub Pages。

## 题库规模

| 模块 | 数量 | 来源 |
|---|---|---|
| 单选题 | 1163 | 历年真题 853（试题分类精解 2018 版）+ AI 精炼 310 |
| 案例分析 | 20 | 数据流图 / 数据库 / UML / 数据结构 / 算法 / 通用模板 |
| 速记卡片 | 95 | 高频必背：排序复杂度、设计模式、协议端口、范式、案例模板等 |

## 功能

- **仪表盘**：已刷题数、正确率、分类进度条、错题数、卡片掌握数；一键继续上次练习
- **刷题**：范围（全部 / 历年真题 / AI 精炼）× 13 个分类自由组合；顺序练习自动存进度，随机热身 20 题
- **判分与解析**：作答即时判分，显示正确答案与解析；答错自动进错题本
- **案例分析**：逐条展开参考答案，标记已练
- **速记卡片**：3D 翻面，认识 / 不认识打标，支持只看未掌握
- **错题本**：重练答对自动移出，角标实时显示待复习数
- **主题**：亮 / 暗一键切换，默认跟随系统

所有学习进度保存在**本机浏览器 localStorage**，不上传任何数据。

## 本地运行

纯静态站，需通过 HTTP 访问（浏览器会拦截 `file://` 下的 fetch）：

```bash
cd soft-exam-web
python -m http.server 8123
# 打开 http://127.0.0.1:8123
```

## 部署到 GitHub Pages（三步）

```bash
# 1. 在 GitHub 新建一个公开仓库（如 soft-exam-web），然后：
git remote add origin https://github.com/<你的用户名>/soft-exam-web.git
git push -u origin main

# 2. 仓库 Settings → Pages → Source 选「Deploy from a branch」，Branch 选 main / (root)

# 3. 等 1-2 分钟，访问 https://<你的用户名>.github.io/soft-exam-web/
```

## 目录结构

```
soft-exam-web/
├── index.html            # 单页应用入口
├── css/style.css         # 亮暗双主题样式
├── js/
│   ├── app.js            # 路由 / 主题 / 全局事件
│   ├── store.js          # localStorage 封装（进度/错题/答题记录）
│   ├── data.js           # 题库加载与查询
│   ├── dash.js           # 仪表盘
│   ├── quiz.js           # 刷题引擎（顺序/随机/真题/错题重练）
│   ├── case.js           # 案例分析
│   ├── cards.js          # 速记卡片
│   └── wrong.js          # 错题本
├── data/
│   ├── questions.json    # 1183 题（单选+案例）
│   └── flashcards.json   # 95 张卡片
└── scripts/
    ├── export_data.cjs   # 从 wechat_ticker 小程序题库重新导出 JSON
    └── ui_smoke.cjs      # Playwright 端到端冒烟测试
```

## 更新题库

题库源在小程序项目 `wechat_ticker/utils/`（`learn_data.js` / `rk_questions.js` / `flashcards.js`），改动后重跑导出即可：

```bash
node scripts/export_data.cjs
```
