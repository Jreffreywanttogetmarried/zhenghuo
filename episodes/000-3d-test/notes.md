# 000 3D 场景测试 · 制作笔记

## 目的

验证 Three.js 能不能接进同一条 `window.renderAt(t)` 渲染管线：

- 场景模块自己创建离屏 WebGL canvas；
- 每帧 `renderer.render(scene, camera)`；
- 把 WebGL canvas `drawImage` 到引擎的 2D canvas；
- 字幕、角标、信息条仍由 2D 层绘制。

## 画面

- 深蓝地球：`MeshPhysicalMaterial` + 经纬网 + 1100 个固定分布的光点。
- 上海 → 洛杉矶金色光弧：球面插值 + 抬升，TubeGeometry + Line。
- 光脉冲：Sprite + 径向渐变纹理，沿弧线循环。
- 镜头：缓慢环绕。
- 所有运动由 `t` 决定，没有随机数。

## 兼容性

- 如果 WebGL 初始化失败，场景自动回退到 2D 光环，并在画面下方提示。
- 无头浏览器可能使用软件 WebGL（SwiftShader），渲染会比 2D 慢；正式 3D 长片建议用有 GPU 的机器，或分段渲染。
- 目前没有接 Bloom 后处理；正式 3D 场景可以加 `UnrealBloomPass`，但会增加渲染时间。

## 预览与渲染

```bash
python tools/render_video.py episodes/000-3d-test --browser msedge --output episodes/000-3d-test/output/000-3d-test.mp4
```

## 验收

- [x] 地球/光弧不是黑屏或纯色
- [x] 字幕、角标、信息条在 WebGL 画面之上清晰可读
- [x] 光脉冲沿弧线运动，速度与 t 一致
- [x] 同一 t 重复渲染结果一致
- [x] 无 WebGL 时能回退 2D，不白屏
- [x] 成片：8.000s，1920×1080，30fps，13.71 Mbps，无音轨
- [x] 6 张关键帧：`output/stills/`
- [x] SRT：`output/000-3d-test.srt`
