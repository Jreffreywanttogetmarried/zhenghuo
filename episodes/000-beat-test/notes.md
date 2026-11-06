# 000 BGM 卡点测试 · 制作笔记

## 目的

验证「无配音、只加 BGM、卡背景音乐」这一条最简路线：

- 12 秒 / 120 BPM；
- 每拍一个视觉脉冲；
- 每 8 拍切一次场景；
- 第 3 幕用 24 拍时间尺对应 12 秒；
- 音频由 `tools/make_test_beat.py` 生成，无版权问题。

## 节拍参数

- BPM：120
- 1 拍：0.5 秒 = 15 帧（30fps）
- 8 拍：4 秒 = 120 帧
- 12 秒：24 拍

`episode.json` 的 audio：

```json
"audio": {
  "src": "assets/audio/test-120bpm.wav",
  "bpm": 120,
  "offset": 0,
  "loop": true,
  "volume": 0.85,
  "fadeOut": 1.5
}
```

场景里用：

```js
const pulse = env.beat.pulse(env.globalT, { power: 2 });
```

`pulse` 在正拍为 1，到下一拍前衰减到 0。

## 预览与渲染

```bash
python -m http.server 8080
# 打开 http://localhost:8080/episodes/000-beat-test/

python tools/render_video.py episodes/000-beat-test --browser msedge
python tools/verify_video.py episodes/000-beat-test/output/000-beat-test.mp4 \
  --duration 12 --allow-audio --require-audio
```

## 验收

- [ ] 每拍画面有可见脉冲
- [ ] 4 秒、8 秒的切场景正好落在第 8、16 拍
- [ ] 成片有音频轨，且音频不被截断/循环异常
- [ ] 末尾有 1.5 秒淡出
- [ ] 无黑帧、无冻结
