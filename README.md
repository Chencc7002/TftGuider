# TFTGuider

一个围绕 TFT 玩家近 30 场对局做复盘的单页分析助手。

项目目标不是做一个大而全的战绩平台，而是把玩家最近一段时间的状态、常用骨架、趋势波动和可执行建议放到同一个页面里，帮助快速复盘。

## 需求文档

- 产品需求文档（PRD）：`docs/requirements.md`

## 当前能力

- Riot 账号数据接入：通过 `gameName + tagLine + region` 拉取近 30 场 TFT 对局
- 单页分析台：顶部概览、趋势图、阵容与英雄分析、风格诊断、逐局复盘
- 阵容分析可视化：阵容表格、阵容使用率环图、阵容分布气泡图
- 英雄分析可视化：核心英雄频次、英雄协同热力图
- 环境基准对照：服务端抓取 MetaBot.GG 热门阵容作为参考层
- 逐局展开复盘：查看每局名次、时间、等级、羁绊骨架、关键单位与复盘建议
- 回放入口 TODO：逐局右侧已预留“查看录像”按钮，后续可接真实回放源
- 失败回退：当 Riot API 不可用时自动使用本地演示数据渲染页面

## 技术栈

- 前端：原生 `HTML + CSS + JavaScript`
- 服务端：Node.js `http` 模块
- 数据源：Riot TFT API、MetaBot.GG 热门阵容页面

## 快速开始

### 1. 安装与启动

项目没有额外依赖，直接运行即可：

```bash
npm start
```

默认端口是 `4173`，启动后访问：

[http://127.0.0.1:4173](http://127.0.0.1:4173)

### 2. 配置环境变量

在项目根目录创建 `.env.local`：

```env
RIOT_API_KEY=your-riot-api-key
PORT=4173
```

也可以直接参考 [`.env.example`](/C:/Users/Chencc/Desktop/TFTGuider/.env.example)。

### 3. 查询真实玩家

页面输入：

- `region`：`KR`、`JP1`、`NA1`、`EUW1`
- `gameName`
- `tagLine`

点击“分析近 30 场”后，前端会请求本地代理接口：

```text
/api/tft/analyze?region=KR&gameName=Souly&tagLine=KR2&count=30
```

## 数据说明

### 来自 Riot 官方的数据

- 当前段位与 LP 快照
- 近 30 场对局列表
- 每局名次、时间、等级、最终单位、羁绊、强化符文
- 淘汰人数、对玩家总伤害、剩余金币等基础字段

### 当前不可直接从 Riot 官方接口获得的数据

- 单局 LP 变化
- 每回合金币曲线 `goldTrend`
- 升人口时间线 `levelUpTimeline`

因此 live 模式下：

- 单局 LP 会明确标记为“Riot 官方未返回”或使用非真实 LP 的替代说明
- 某些高阶节奏分析会降级展示，避免伪造数据

### 本地推断字段

下面这些内容不是 Riot 直接返回，而是根据近 30 场对局做的聚合或规则推断：

- 羁绊骨架命名
- 常用阵容统计
- 核心英雄频率
- 风格标签与复盘建议
- 与环境热门阵容的相似度对比

## 页面结构

### 1. 顶部玩家概览

- 昵称、区服、段位
- 平均名次、前四率、吃鸡率、波动指数
- 最近 10 场与前 20 场对比

### 2. 趋势分析

- 名次趋势折线图
- LP / 指标趋势图
- 名次分布图

### 3. 阵容与英雄分析

- 高频羁绊骨架卡片
- 核心英雄使用频次
- 英雄协同热力图
- 阵容数据表
- 阵容使用率环图
- 阵容分布气泡图

### 4. 风格诊断

- 经济倾向
- 运营倾向
- 稳定性
- 环境对照
- 复盘建议

### 5. 最近对局

- 逐局展开复盘
- 查看录像按钮占位

## 服务端接口

### `GET /api/tft/analyze`

查询参数：

- `region`
- `gameName`
- `tagLine`
- `count`，最大 `30`

返回内容包含：

- `player`
- `matches`
- `metaBenchmark`
- `unavailableFields`

核心实现位于 [server.js](/C:/Users/Chencc/Desktop/TFTGuider/server.js)。

## 目录结构

- [index.html](/C:/Users/Chencc/Desktop/TFTGuider/index.html)：页面结构
- [styles.css](/C:/Users/Chencc/Desktop/TFTGuider/styles.css)：视觉与布局
- [app.js](/C:/Users/Chencc/Desktop/TFTGuider/app.js)：前端分析与渲染逻辑
- [server.js](/C:/Users/Chencc/Desktop/TFTGuider/server.js)：本地静态服务与 Riot 代理
- [prompts/tft-analysis-prototype-prompt.md](/C:/Users/Chencc/Desktop/TFTGuider/prompts/tft-analysis-prototype-prompt.md)：产品原型提示词

## 当前已知限制

- 目前不是 Riot OAuth 登录流程，而是基于 Riot ID 查询
- 阵容名称仍以“羁绊骨架 + 核心单位”方式呈现，不是完整的第三方标准阵容库命名
- 回放能力只有入口，真实录像获取方案尚未接入
- Meta 环境基准依赖第三方页面结构，后续最好改成更稳定的数据源
- 控制台可能出现一个无害的 `favicon.ico 404`

## 后续方向

- 接入真实 Riot 登录态
- 标准阵容识别与阵容映射
- 更精细的阶段节奏分析
- 真实录像回放接入
- 更完整的版本环境对照与多时间窗口筛选
