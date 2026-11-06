# 字体

本目录包含两套可变字体，供 Canvas 与浏览器渲染使用：

| 文件 | 字体 | 用途 | 许可 |
|---|---|---|---|
| `NotoSansSC-VF.ttf` | Noto Sans SC | 字幕、角标、图表标签、数字 | SIL Open Font License 1.1 |
| `NotoSerifSC-VF.ttf` | Noto Serif SC | 金句、标题卡、历史/投资标题 | SIL Open Font License 1.1 |

- 可变字重范围 100–900；字幕用 700，关键词 800，金句 900。
- 文件来自系统字体目录，复制到项目内以保证换机器渲染结果一致。
- Noto 字体由 Google / Adobe 开发，许可允许免费使用、修改和再分发；再分发时保留许可声明。
- 许可全文：https://scripts.sil.org/OFL

## 替换字体

如果换成其他字体：

1. 把字体文件放进本目录；
2. 修改 `engine/base.css` 的 `@font-face`；
3. 修改 `engine/palettes.js` 里的 `fontTitle` / `fontBody`；
4. 重新渲染并检查字重、行高、溢出。

> 不要用 three.js 的 3D 文字几何体渲染中文；中文一律在 Canvas/DOM 层用网页字体。
