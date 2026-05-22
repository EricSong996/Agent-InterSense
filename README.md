# InterSense

课程作业用多模型聊天网页（仿 ChatGPT）：**DeepSeek**、**豆包**、博查联网搜索，可部署 GitHub Pages，也可导入扣子编程。

## 功能

- 仿 ChatGPT 深色界面，支持手机侧栏
- 多个聊天会话（保存在浏览器 `localStorage`）
- 模型切换：DeepSeek / 豆包
- **联网搜索开关**（博查）：开启后先检索网页再回答
- 流式回复 + 代码高亮

## 快速开始

### 1. 填写 API Key

```bash
# 首次克隆后：从模板生成 config.ts（仓库内不含真实 Key）
copy src\config.example.ts src\config.ts
```

编辑 [`src/config.ts`](src/config.ts)（此文件已在 `.gitignore`，不会 push 到 GitHub）：

**博查联网（可选，开启「联网搜索」时需要）：**

```ts
bocha: {
  apiKey: '你的博查 API Key',  // https://open.bochaai.com 注册 → API KEY 管理
  ...
},
```

```ts
'deepseek-v4-flash': { apiKey: '你的 DeepSeek Key', model: 'deepseek-v4-flash', ... },
'deepseek-v4-pro': { apiKey: '你的 DeepSeek Key', model: 'deepseek-v4-pro', ... },
doubao: {
  apiKey: '你的火山方舟 Key',
  model: '你的推理接入点 ID',  // 在火山方舟控制台创建
},
```

- DeepSeek：https://platform.deepseek.com  
- 豆包（火山方舟）：https://console.volcengine.com/ark  

### 2. 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端提示的地址（一般是 http://localhost:5173）。

### 3. 部署到 GitHub Pages

1. 把代码 push 到 GitHub 仓库（例如仓库名 `Agent`）。
2. 若仓库名不是 `Agent`，修改 [`vite.config.ts`](vite.config.ts) 里的 `base: '/Agent/'` 为 `/你的仓库名/`。
3. 仓库 **Settings → Pages → Build and deployment** 选 **GitHub Actions**。
4. push 到 `main` 或 `master` 分支后，Actions 会自动构建部署。

本地模拟 Pages 构建：

```bash
npm run build:pages
npm install -D cross-env   # 若未安装
```

Windows 也可：

```powershell
$env:GITHUB_PAGES='true'; npm run build
```

## 费用说明

请求使用 `config.ts` 中的 API Key，消耗对应平台账号额度。仅自己/老师试用、且 Key 未泄露时，费用通常很少。

## 跨域（CORS）

部分环境下浏览器直连豆包/DeepSeek/博查 可能被 CORS 拦截。若出现 `Failed to fetch`：

- 优先在本地 `npm run dev` 演示；
- 或后续增加 Cloudflare Worker 代理（当前版本为纯前端直连）。

## 联网搜索（博查）

1. 在 [博查开放平台](https://open.bochaai.com) 微信登录并创建 API Key  
2. 填入 `config.ts` 的 `bocha.apiKey`  
3. 在聊天页打开 **「联网搜索」** 开关后再提问  

费用：博查按次/套餐计费，与 DeepSeek/豆包 账单分开。

## 上传到 GitHub

```bash
git init
git add .
git commit -m "Initial commit: InterSense chat app"
```

在 GitHub 新建仓库（例如名 `Agent` 或 `InterSense`），然后：

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

**注意：** `src/config.ts` 不会上传（含 API Key）。克隆后需自行 `copy config.example.ts → config.ts` 并填 Key。

## 导入扣子编程（Coze）

1. 代码先 push 到 GitHub（见上）。  
2. 打开 [扣子编程](https://www.coze.cn) → 导入 GitHub 仓库。  
3. 在扣子 **环境变量** 中配置 Key（勿把 Key 写进公开仓库）。  
4. 在开发环境 **先跑通对话**，再点部署（避免「项目仍在开发中，不支持部署」）。

本地 InterSense 网页与扣子部署是两条线：作业演示也可用 **GitHub Pages** 链接。

## 技术栈

Vite · React · TypeScript · Tailwind CSS · marked · highlight.js
