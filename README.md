# TFTGuider

当前目录已经包含一个可运行的单页 MVP：

- [index.html](/C:/Users/Chencc/Desktop/TFTGuider/index.html)
- [app.js](/C:/Users/Chencc/Desktop/TFTGuider/app.js)
- [server.js](/C:/Users/Chencc/Desktop/TFTGuider/server.js)
- [prompts/tft-analysis-prototype-prompt.md](/C:/Users/Chencc/Desktop/TFTGuider/prompts/tft-analysis-prototype-prompt.md)

## 已实现

- 单页分析台 UI
- Riot API 代理接口 `/api/tft/analyze`
- 近 30 场标准化数据结构
- 本地聚合分析：平均名次、前四率、吃鸡率、名次分布、阵容统计、英雄频率、协同热力图、风格诊断、复盘建议
- API 失败时自动回退到演示数据

## 启动方式

1. 在项目根目录创建 `.env.local`
2. 写入你的 Riot key：`RIOT_API_KEY=你的Key`
3. 运行：`npm start`
4. 打开 [http://127.0.0.1:4173](http://127.0.0.1:4173)

如果没有配置 key，页面仍会用本地演示数据渲染，方便继续改 UI。
