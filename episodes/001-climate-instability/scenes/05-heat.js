// 05 · 高温更难熬：破纪录、城市蓄热、热盖子
import {
  drawTag,
  drawLabel,
  drawDot,
  drawRing,
} from '../../../engine/components.js';
import {
  clamp,
  easeInOutCubic,
  easeOutCubic,
  easeOutBack,
  seeded,
  seededRange,
  TAU,
  roundRect,
} from '../../../engine/math.js';

const W = 1920;
const H = 1080;

function drawSky(ctx, p, t) {
  const night = clamp((t - 7.8) / 2.2);

  const sky = ctx.createLinearGradient(0, 0, 0, 760);
  sky.addColorStop(0, '#07182A');
  sky.addColorStop(0.55, '#1A2A35');
  sky.addColorStop(0.82, 'rgba(150,80,40,0.72)');
  sky.addColorStop(1, 'rgba(90,45,22,0.9)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 760);

  if (night > 0) {
    const dark = ctx.createLinearGradient(0, 0, 0, 760);
    dark.addColorStop(0, `rgba(2,4,10,${0.78 * night})`);
    dark.addColorStop(0.7, `rgba(4,8,14,${0.62 * night})`);
    dark.addColorStop(1, `rgba(8,10,14,${0.45 * night})`);
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, W, 760);
  }

  // 夜里几点星
  if (night > 0.2) {
    const rng = seeded(6201);
    ctx.save();
    for (let i = 0; i < 34; i++) {
      const x = seededRange(rng, 0, W);
      const y = seededRange(rng, 20, 360);
      ctx.globalAlpha = 0.1 + 0.2 * night * (0.5 + 0.5 * Math.sin(t * 1.1 + i));
      ctx.fillStyle = '#C9E6FF';
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // 太阳
  const sunY = 168 + 260 * night;
  const sunAlpha = 1 - 0.55 * night;
  const sunX = 430;
  const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 170);
  sun.addColorStop(0, `rgba(255,248,220,${sunAlpha})`);
  sun.addColorStop(0.2, `rgba(255,214,140,${0.92 * sunAlpha})`);
  sun.addColorStop(0.55, `rgba(255,160,80,${0.3 * sunAlpha})`);
  sun.addColorStop(1, 'rgba(255,160,80,0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 170, 0, TAU);
  ctx.fill();

  // 日冕
  ctx.save();
  ctx.globalAlpha = sunAlpha * 0.55;
  ctx.strokeStyle = 'rgba(255,214,150,0.85)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU + t * 0.04;
    const r0 = 58 + 4 * Math.sin(t * 1.2 + i);
    const r1 = 78 + 10 * (0.5 + 0.5 * Math.sin(t * 1.5 + i * 2.1));
    ctx.beginPath();
    ctx.moveTo(sunX + Math.cos(a) * r0, sunY + Math.sin(a) * r0);
    ctx.lineTo(sunX + Math.cos(a) * r1, sunY + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = sunAlpha;
  ctx.fillStyle = '#FFF0C8';
  ctx.shadowColor = 'rgba(255,193,94,0.9)';
  ctx.shadowBlur = 42;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 46, 0, TAU);
  ctx.fill();
  ctx.restore();

  // 地平线暖光
  const horizon = ctx.createLinearGradient(0, 560, 0, 780);
  horizon.addColorStop(0, `rgba(255,140,70,${0.1 + 0.12 * night})`);
  horizon.addColorStop(1, 'rgba(255,140,70,0)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 560, W, 240);
}

function drawCity(ctx, p, t) {
  const night = clamp((t - 7.8) / 2.2);
  const buildings = [
    [820, 520, 110, 220], [940, 470, 90, 270], [1040, 540, 120, 200],
    [1170, 430, 100, 310], [1280, 500, 130, 240], [1420, 460, 90, 280],
    [1520, 520, 120, 220], [1650, 480, 100, 260], [1760, 540, 100, 200],
  ];
  const rng = seeded(1106);

  ctx.save();
  for (const [x, y, w, h] of buildings) {
    ctx.fillStyle = 'rgba(5,12,20,0.94)';
    ctx.fillRect(x, y, w, h);

    // 楼顶轮廓光
    ctx.strokeStyle = `rgba(255,150,80,${0.12 + 0.18 * night})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();

    // 窗
    for (let wy = y + 20; wy < y + h - 18; wy += 32) {
      for (let wx = x + 14; wx < x + w - 12; wx += 26) {
        if (seededRange(rng, 0, 1) < 0.52) {
          ctx.fillStyle = `rgba(255,193,94,${0.18 + 0.42 * night})`;
          ctx.fillRect(wx, wy, 8, 12);
        }
      }
    }
  }

  // 天线
  ctx.strokeStyle = 'rgba(160,180,190,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(1210, 430);
  ctx.lineTo(1210, 388);
  ctx.moveTo(1460, 460);
  ctx.lineTo(1460, 420);
  ctx.stroke();
  ctx.restore();
}

function drawChart(ctx, p, t) {
  const cardIn = clamp((t - 2.6) / 0.6);
  const alpha = cardIn * (1 - clamp((t - 7.6) / 1.2));
  if (alpha <= 0.01) return;

  const x = 1288;
  const y = 116;
  const w = 506;
  const h = 250;

  ctx.save();
  ctx.globalAlpha = alpha;

  const card = ctx.createLinearGradient(x, y, x + w, y + h);
  card.addColorStop(0, 'rgba(10,24,38,0.86)');
  card.addColorStop(1, 'rgba(4,10,18,0.7)');
  ctx.fillStyle = card;
  ctx.strokeStyle = 'rgba(255,193,94,0.2)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();

  ctx.font = '600 24px "Noto Sans SC", sans-serif';
  ctx.fillStyle = p.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('高温纪录', x + 28, y + 38);

  // 旧纪录线
  const chartX = x + 42;
  const chartW = w - 84;
  const baseY = y + h - 44;
  const topY = y + 72;
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = 'rgba(160,225,255,0.28)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(chartX, y + 112);
  ctx.lineTo(chartX + chartW, y + 112);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '500 17px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(160,225,255,0.5)';
  ctx.textAlign = 'left';
  ctx.fillText('旧纪录', chartX, y + 100);

  // 折线
  const n = 10;
  const grow = easeOutCubic(clamp((t - 3.1) / 2.8));
  const points = [];
  for (let i = 0; i < n; i++) {
    const px = chartX + (chartW * i) / (n - 1);
    const isLast = i === n - 1;
    const base = isLast ? 0.94 : 0.18 + i * 0.066;
    const wobble = isLast ? 0 : 0.1 * Math.sin(i * 1.3);
    const py = baseY - (base + wobble) * (baseY - topY);
    points.push({ x: px, y: py });
  }
  const count = Math.max(2, Math.floor(grow * (n - 1)) + 1);

  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(255,193,94,0.5)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < count; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const mx = (prev.x + cur.x) / 2;
    ctx.bezierCurveTo(mx, prev.y, mx, cur.y, cur.x, cur.y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  for (let i = 0; i < count; i++) {
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 3, 0, TAU);
    ctx.fill();
  }

  // 最后一个点破纪录
  const last = points[n - 1];
  if (grow > 0.92) {
    const pop = easeOutBack(clamp((t - 5.9) / 0.5));
    drawRing(ctx, {
      x: last.x, y: last.y, r: 9 + 10 * pop,
      color: p.accent2, width: 2, alpha: 0.7,
    });
    drawDot(ctx, { x: last.x, y: last.y, r: 5, color: '#FFE9B0', glow: 20 });
    drawLabel(ctx, {
      x: last.x - 12,
      y: last.y - 34,
      text: '新高',
      color: p.accent2,
      font: '700 22px "Noto Sans SC", sans-serif',
      align: 'right',
    });
  }

  ctx.restore();
}

function drawStreet(ctx, p, t) {
  const night = clamp((t - 7.8) / 2.2);

  // 人行道
  const walk = ctx.createLinearGradient(0, 700, 0, 770);
  walk.addColorStop(0, '#2A211C');
  walk.addColorStop(1, '#171210');
  ctx.fillStyle = walk;
  ctx.fillRect(0, 700, W, 70);

  // 马路
  const road = ctx.createLinearGradient(0, 760, 0, H);
  road.addColorStop(0, '#2A1C16');
  road.addColorStop(0.4, '#1A100C');
  road.addColorStop(1, '#0A0605');
  ctx.fillStyle = road;
  ctx.fillRect(0, 760, W, H - 760);

  // 路面标线
  ctx.save();
  ctx.strokeStyle = 'rgba(232,214,179,0.18)';
  ctx.lineWidth = 5;
  ctx.setLineDash([40, 46]);
  ctx.beginPath();
  ctx.moveTo(0, 930);
  ctx.lineTo(W, 930);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 热浪
  ctx.save();
  ctx.strokeStyle = `rgba(255,170,90,${0.14 + 0.12 * night})`;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 12; i++) {
    const baseY = 770 + i * 22;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 18) {
      const y = baseY + Math.sin(x * 0.016 + t * 1.8 + i * 0.8) * 5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // 路灯
  for (const lx of [610, 1120, 1620]) {
    ctx.save();
    ctx.strokeStyle = 'rgba(120,130,135,0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lx, 760);
    ctx.lineTo(lx, 548);
    ctx.quadraticCurveTo(lx, 520, lx + 28, 520);
    ctx.stroke();

    const lamp = ctx.createRadialGradient(lx + 36, 526, 0, lx + 36, 526, 90);
    lamp.addColorStop(0, `rgba(255,214,150,${0.5 + 0.3 * night})`);
    lamp.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = lamp;
    ctx.beginPath();
    ctx.arc(lx + 36, 526, 90, 0, TAU);
    ctx.fill();

    ctx.fillStyle = `rgba(255,235,190,${0.7 + 0.25 * night})`;
    ctx.beginPath();
    ctx.arc(lx + 36, 526, 9, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 地面光池
    ctx.save();
    ctx.globalAlpha = 0.12 + 0.18 * night;
    const pool = ctx.createRadialGradient(lx + 36, 800, 0, lx + 36, 800, 160);
    pool.addColorStop(0, 'rgba(255,193,94,0.7)');
    pool.addColorStop(1, 'rgba(255,193,94,0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(lx + 36, 810, 160, 40, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawBusStop(ctx, p, t) {
  const night = clamp((t - 7.8) / 2.2);
  const x = 742;
  const y = 640;

  ctx.save();
  // 顶棚
  ctx.fillStyle = 'rgba(14,26,36,0.95)';
  roundRect(ctx, x - 36, y - 74, 240, 14, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,225,255,0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 36, y - 60);
  ctx.lineTo(x - 36, y + 60);
  ctx.moveTo(x + 190, y - 60);
  ctx.lineTo(x + 190, y + 60);
  ctx.stroke();

  // 站牌
  ctx.strokeStyle = 'rgba(160,170,175,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 70);
  ctx.lineTo(x + 10, y - 64);
  ctx.stroke();

  ctx.fillStyle = 'rgba(10,24,38,0.95)';
  roundRect(ctx, x - 8, y - 118, 128, 58, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(127,208,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = '700 24px "Noto Sans SC", sans-serif';
  ctx.fillStyle = p.accent2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('公交站', x + 56, y - 92);

  // 长椅
  ctx.fillStyle = 'rgba(70,52,38,0.9)';
  roundRect(ctx, x + 26, y + 12, 128, 10, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(40,30,22,0.95)';
  ctx.fillRect(x + 34, y + 22, 8, 28);
  ctx.fillRect(x + 138, y + 22, 8, 28);
  ctx.restore();

  // 站牌灯
  ctx.save();
  ctx.globalAlpha = 0.18 + 0.3 * night;
  const glow = ctx.createRadialGradient(x + 56, y - 90, 0, x + 56, y - 90, 80);
  glow.addColorStop(0, 'rgba(127,208,255,0.6)');
  glow.addColorStop(1, 'rgba(127,208,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + 56, y - 90, 80, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawTree(ctx, p, t) {
  const x = 176;
  const y = 746;

  ctx.save();
  // 树干
  ctx.strokeStyle = 'rgba(42,28,18,0.95)';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 12, y - 120, x + 8, y - 210);
  ctx.stroke();

  // 树冠
  const sway = Math.sin(t * 0.6) * 5;
  const blobs = [
    [-88, -220, 78, 52], [-18, -250, 92, 60], [58, -226, 80, 54],
    [-48, -190, 74, 48], [20, -188, 82, 50],
  ];
  for (let i = 0; i < blobs.length; i++) {
    const [bx, by, rx, ry] = blobs[i];
    const grad = ctx.createRadialGradient(x + bx, y + by, 0, x + bx, y + by, rx);
    grad.addColorStop(0, i % 2 === 0 ? 'rgba(36,72,62,0.95)' : 'rgba(28,58,50,0.95)');
    grad.addColorStop(1, 'rgba(12,28,24,0.92)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x + bx + sway, y + by, rx, ry, 0, 0, TAU);
    ctx.fill();
  }

  // 叶隙光
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = 'rgba(255,214,150,0.7)';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const rr = 40 + (i % 4) * 22;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * rr, y - 220 + Math.sin(a) * rr * 0.55, 2.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawElder(ctx, p, t) {
  const night = clamp((t - 7.8) / 2.2);
  const x = 318;
  const y = 706;
  const sway = Math.sin(t * 0.7);

  ctx.save();
  // 椅子
  ctx.strokeStyle = 'rgba(40,26,18,0.98)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x - 40, y + 40);
  ctx.lineTo(x - 40, y - 40);
  ctx.lineTo(x + 54, y - 40);
  ctx.lineTo(x + 54, y + 40);
  ctx.moveTo(x - 40, y + 40);
  ctx.lineTo(x - 54, y + 92);
  ctx.moveTo(x + 54, y + 40);
  ctx.lineTo(x + 68, y + 92);
  ctx.stroke();

  // 身体
  ctx.fillStyle = 'rgba(8,14,20,0.98)';
  ctx.beginPath();
  ctx.moveTo(x - 34, y + 30);
  ctx.quadraticCurveTo(x - 46, y - 74, x - 8, y - 92);
  ctx.quadraticCurveTo(x + 34, y - 104, x + 42, y - 52);
  ctx.quadraticCurveTo(x + 48, y - 4, x + 30, y + 30);
  ctx.closePath();
  ctx.fill();

  // 头
  ctx.beginPath();
  ctx.arc(x - 2, y - 128, 34, 0, TAU);
  ctx.fill();

  // 发髻
  ctx.beginPath();
  ctx.arc(x + 24, y - 148, 15, 0, TAU);
  ctx.fill();

  // 轮廓光
  ctx.strokeStyle = `rgba(255,193,94,${0.22 + 0.18 * night})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x - 2, y - 128, 34, Math.PI * 0.85, Math.PI * 1.6);
  ctx.stroke();

  // 手臂和扇子
  const fanX = x + 66 + sway * 4;
  const fanY = y - 70 + sway * 3;
  ctx.strokeStyle = 'rgba(8,14,20,0.98)';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 18, y - 74);
  ctx.quadraticCurveTo(x + 58, y - 60, fanX, fanY);
  ctx.stroke();

  ctx.save();
  ctx.translate(fanX, fanY);
  ctx.rotate(-0.3 + sway * 0.08);
  ctx.fillStyle = 'rgba(212,176,112,0.9)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 34, -1.1, 1.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,54,30,0.65)';
  ctx.lineWidth = 1.5;
  for (let i = -3; i <= 3; i++) {
    const a = (i / 3) * 1.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 33, Math.sin(a) * 33);
    ctx.stroke();
  }
  ctx.restore();

  // 腿
  ctx.strokeStyle = 'rgba(8,14,20,0.98)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(x - 16, y + 24);
  ctx.quadraticCurveTo(x - 34, y + 62, x - 22, y + 86);
  ctx.moveTo(x + 20, y + 24);
  ctx.quadraticCurveTo(x + 42, y + 58, x + 38, y + 84);
  ctx.stroke();

  // 拐杖
  ctx.strokeStyle = 'rgba(150,110,60,0.9)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 92, y + 88);
  ctx.lineTo(x + 92, y - 30);
  ctx.quadraticCurveTo(x + 92, y - 48, x + 106, y - 48);
  ctx.stroke();
  ctx.restore();
}

function drawDome(ctx, p, t) {
  const dome = easeOutCubic(clamp((t - 13.4) / 1.8));
  if (dome <= 0.001) return;
  const offsetY = (1 - dome) * -190;

  ctx.save();
  ctx.translate(0, offsetY);

  const top = 264;
  const left = 92;
  const right = 1830;
  const bottom = 812;

  // 锅盖主体
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  ctx.bezierCurveTo(left + 70, top, right - 70, top, right, bottom);
  ctx.closePath();

  const glass = ctx.createLinearGradient(0, top, 0, bottom);
  glass.addColorStop(0, `rgba(255,170,90,${0.2 * dome})`);
  glass.addColorStop(0.5, `rgba(255,150,70,${0.08 * dome})`);
  glass.addColorStop(1, 'rgba(255,150,70,0.015)');
  ctx.fillStyle = glass;
  ctx.fill();

  // 玻璃边缘的柔光
  ctx.strokeStyle = `rgba(255,214,150,${0.22 * dome})`;
  ctx.lineWidth = 11;
  ctx.shadowColor = 'rgba(255,150,70,0.55)';
  ctx.shadowBlur = 28;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = `rgba(255,193,94,${0.78 * dome})`;
  ctx.lineWidth = 4;
  ctx.stroke();

  // 锅盖把手
  const knobX = 960;
  const knobY = top + 6;
  ctx.strokeStyle = `rgba(255,214,150,${0.65 * dome})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(knobX, knobY);
  ctx.lineTo(knobX, knobY - 26);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(knobX, knobY - 40, 18, 0, TAU);
  ctx.fillStyle = `rgba(255,193,94,${0.18 * dome})`;
  ctx.fill();
  ctx.stroke();

  // 被挡回来的热气
  const rng = seeded(7301);
  ctx.strokeStyle = `rgba(255,170,90,${0.32 * dome})`;
  ctx.lineWidth = 2.6;
  for (let i = 0; i < 16; i++) {
    const bx = seededRange(rng, 150, 1770);
    const phase = seededRange(rng, 0, 1);
    const u = (t * 0.22 + phase) % 1;
    const by = 790 - u * 500;
    const bend = Math.sin(u * Math.PI) * 36;
    ctx.globalAlpha = 0.12 + 0.26 * (1 - u);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + bend, by - 40, bx + bend * 0.4, by - 80);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (dome > 0.6) {
    drawLabel(ctx, {
      x: 1018,
      y: 308,
      text: '热盖子（示意）',
      target: { x: 960, y: 244 },
      color: p.accent,
      font: '600 24px "Noto Sans SC", sans-serif',
      align: 'left',
      leaderColor: 'rgba(255,193,94,0.6)',
    });
  }
}

function drawSummaryTags(ctx, p, t) {
  const show = easeOutCubic(clamp((t - 16.4) / 1.0));
  if (show <= 0.001) return;
  const items = [
    { x: 690, y: 160, label: '雨', color: p.accent2 },
    { x: 960, y: 150, label: '旱', color: p.accent },
    { x: 1230, y: 160, label: '热', color: p.accent2 },
  ];
  ctx.save();
  ctx.globalAlpha = show;
  for (const item of items) {
    const pulse = 1 + 0.05 * Math.sin(t * 3 + item.x);
    drawRing(ctx, {
      x: item.x, y: item.y, r: 30 * pulse,
      color: item.color, width: 2, alpha: 0.55,
    });
    ctx.fillStyle = item.color;
    ctx.font = '900 34px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, item.x, item.y + 2);
  }
  ctx.restore();
}

export default {
  draw(ctx, t, env) {
    const p = env.palette;

    const zoom = 1.0 + 0.025 * easeInOutCubic(t / 13) + 0.03 * easeInOutCubic(clamp((t - 13.4) / 3)) - 0.02 * easeInOutCubic(clamp((t - 16.6) / 2.4));
    ctx.save();
    ctx.translate(W / 2, H * 0.54);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H * 0.54);

    drawSky(ctx, p, t);
    drawCity(ctx, p, t);
    drawStreet(ctx, p, t);
    drawBusStop(ctx, p, t);
    drawTree(ctx, p, t);
    drawElder(ctx, p, t);
    drawDome(ctx, p, t);
    drawSummaryTags(ctx, p, t);
    drawChart(ctx, p, t);

    // 标签
    drawTag(ctx, {
      x: 120,
      y: 92,
      text: '05 · 高温更难熬',
      color: p.accent,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(255,193,94,0.3)',
    });

    // 来源
    ctx.save();
    ctx.font = '500 20px "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(244,247,251,0.36)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('高温纪录、城市蓄热为示意 · 数据：中国气象局《中国气候变化蓝皮书（2026）》', 120, 1026);
    ctx.restore();

    ctx.restore();
  },
};
