# BB 我们和好好不好 💗

手机端和好网页：提问页（逃跑按钮）→ 电影字幕式情书 → 幸运大转盘（真随机、只能抽一次），
所有关键动作记录到 MongoDB。

## 项目结构

```
pages/index.js        提问页："好呀" + 会逃跑的"才不要"
pages/letter.js       情书滚动页 + 抽奖入口 + 结果卡片
components/Wheel.js   轮盘（结果由后端决定，前端只负责转过去）
lib/prizes.js         8 个奖品（前后端共用，顺序不能改）
lib/mongodb.js        数据库连接
lib/session.js        浏览器端 sessionId
pages/api/yes.js      记录点击"好呀"的时间
pages/api/draw.js     抽奖（crypto 真随机 + 原子更新防重复）
pages/api/dodge.js    记录"才不要"被逃跑了几次（彩蛋）
public/music.mp3      背景音乐（需要你自己放，见下）
```

## 部署步骤（从零到上线约 30 分钟）

### 1. MongoDB Atlas（免费）
1. 注册 https://www.mongodb.com/cloud/atlas → 创建 **M0 免费 cluster**（区域选 Singapore 最近）
2. Database Access → 创建数据库用户（记住用户名密码）
3. Network Access → Add IP → **0.0.0.0/0**（允许所有来源，Vercel 的 IP 不固定，必须这样设）
4. Database → Connect → Drivers → 复制连接串，形如：
   `mongodb+srv://用户名:密码@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### 2. 本地跑起来
```bash
npm install
cp .env.local.example .env.local   # 然后把里面的连接串换成你自己的
npm run dev                        # 打开 http://localhost:3000
```
手机同网段测试：用电脑 IP 访问，如 `http://192.168.x.x:3000`

### 3. 背景音乐
把《只对你有感觉》的 mp3 放到 `public/music.mp3`。
用你自己合法拥有的音频（例如从你付费订阅的音乐平台导出）。
手机浏览器不允许自动播放，所以页面左下角有个音乐按钮，她点一下就开始循环播放。

### 4. 部署到 Vercel（免费）
1. 代码推到 GitHub（`.gitignore` 已排除 `.env.local`，密码不会泄露；
   注意 music.mp3 也被排除了 —— 如果你的仓库是私有的，可以从 .gitignore 删掉那一行让音乐一起部署）
2. https://vercel.com → Import 该仓库
3. Settings → Environment Variables → 添加 `MONGODB_URI` = 你的连接串
4. Deploy → 得到 `https://xxx.vercel.app` 链接，发给她 💌

### 5. 查看她的记录
MongoDB Atlas → Browse Collections → `hehao.events`：
```json
{
  "sessionId": "…",
  "saidYesAtLocal": "2026/7/12 20:31:05",   // 马来西亚时间，她点"好呀"的时刻
  "prize": "越南旅游全套包完五天四夜",
  "prizeIndex": 3,
  "drawnAtLocal": "2026/7/12 20:34:22",
  "noButtonDodges": 7,                       // 她试图点"才不要"了 7 次 😂
  "userAgent": "…"
}
```

## 防作弊设计
- 抽奖结果在**后端**用 `crypto.randomInt` 生成（密码学级真随机），前端只是把轮盘转到对应格子
- 数据库原子更新 `{ sessionId, prize: null }`：同一 session 第二次请求直接返回第一次的结果
- 刷新页面：进入信件页会先向服务器查状态，抽过就直接显示原结果

## 想改内容？
- 情书文字：`pages/letter.js` 顶部 `LETTER` 数组
- 奖品：`lib/prizes.js`（改完前后端自动同步）
- "才不要"求饶语录：`pages/index.js` 顶部 `NO_PHRASES`
