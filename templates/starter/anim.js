/* Scenes for ONE video. Rewrite this file for every new topic; engine.js never changes.
 *
 * Time everything from S.cue(k) / S.at(k, f) — the moment narration line k starts — so the picture
 * appears exactly when it is spoken. Never hardcode seconds: line lengths change when audio is rebuilt.
 * Layout: content must stay above y = 860 (y≈914..1044 is the subtitle band).
 *
 * This starter explains the pipeline itself. Use it as a shape, not as content:
 *   intro -> 3 step scenes -> outro, with one continuous motion per narration line.
 */

const PROBLEM = null;   // no source screenshot in this template; engine skips it when null

const TAGS = {
  intro:  ['01', '开场', 'Opening'],
  script: ['02', '写脚本', 'Script'],
  voice:  ['03', '配音与时间轴', 'Voice'],
  render: ['04', '逐帧渲染', 'Render'],
  outro:  ['05', '小结', 'Recap'],
};

// ---------------------------------------------------------------- helpers
/** A hand-drawn rectangle; p = stroke progress 0..1. Seed comes from the position, so it is stable. */
function box4(x0, y0, x1, y1, col, p = 1) {
  draw([[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]],
    { c: col, w: 4, p: clamp(p), seed: Math.round(x0 + y0 * 3) });
}

/** Three boxes joined by arrows, appearing one after another as p runs 0..1. */
function stepBar(y, p, items) {
  const w = 300, gap = 90, n = items.length, total = n * w + (n - 1) * gap;
  const x0 = 960 - total / 2;
  items.forEach(([label, col], i) => {
    const pp = clamp(p * n - i);
    if (pp <= 0) return;
    const x = x0 + i * (w + gap), cx = x + w / 2;
    scaleAt(cx, y, back(pp), () => {
      fillPts([[x, y - 66], [x + w, y - 66], [x + w, y + 66], [x, y + 66]], '#fffdf7');
      box4(x, y - 66, x + w, y + 66, col);
      txt(label, cx, y + 14, { size: 46, c: col });
    });
    if (i < n - 1 && pp > 0.6) {
      arrow([[x + w + 16, y], [x + w + gap - 16, y]], { c: C.gray, w: 5, head: 14 });
    }
  });
}

// ---------------------------------------------------------------- scenes
const SC = {};

// 01: title, then a rule that draws itself across, then the three-step bar pops in
SC.intro = (lt, S) => {
  const { P, at } = S;
  txt('代码化视频', 960, 300, { size: 100, p: P(0.15, 0.8) });
  txt('Code-rendered video', 960, 378, { size: 40, f: EN, c: C.blue, p: P(0.45, 0.7) });
  // the "it is drawn" line: grows left to right while line 0 is spoken
  const g = P(at(0, 0.3), Math.max(1.0, S.dur(0) * 0.6));
  if (g > 0) line(420, 470, lerp(420, 1500, eio(g)), 470, { c: C.gray, w: 4 });
  stepBar(610, P(at(1, 0.1), Math.max(1.2, S.dur(1) * 0.7)),
    [['写脚本', C.blue], ['配音', C.green], ['渲染', C.red]]);
};

// 02: three rule boxes, each outline drawn on as its idea is named
SC.script = (lt, S) => {
  const { P, at } = S;
  txt('第一步 · 拆句', 470, 160, { size: 58, p: P(0.1, 0.7) });
  const rows = ['先说结论', '一句一件事', '每句配一个动作'];
  const t0 = [at(0, 0.15), at(0, 0.55), at(1, 0.25)];
  rows.forEach((s, i) => {
    const pp = P(t0[i], 0.85);
    if (pp <= 0) return;
    const y = 330 + i * 175, x0 = 200, x1 = 880;
    grp(clamp(pp * 2), () => {
      box4(x0, y - 56, x1, y + 56, C.ink, pp);
      txt(s, x0 + 46, y + 16, { size: 46, al: 'left', p: clamp(pp * 2 - 0.6) });
    });
  });
  board(1);
  bl(0, '拆句 Breaks:', 0, lt, { c: C.gray, size: 32 });
  bl(1, '一句一件事', at(0, 0.2), lt);
  bl(3, '一个动作跟一句话', at(1, 0.2), lt, { c: C.blue });
};

// 03: a waveform grows as the voice is made, then the timeline ruler appears under it
SC.voice = (lt, S) => {
  const { P, at } = S;
  txt('第二步 · 配音与时间轴', 470, 160, { size: 58, p: P(0.1, 0.7) });
  const x0 = 200, x1 = 880, y = 440;
  const g = P(at(0, 0.25), Math.max(2.0, (S.dur(0) + S.dur(1)) * 0.6));   // spans both lines: continuous
  if (g > 0) {
    const n = 180, pts = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      if (t > g) break;
      const amp = 72 * (0.35 + 0.65 * Math.abs(Math.sin(t * Math.PI * 3.1)));
      pts.push([lerp(x0, x1, t), y + Math.sin(t * Math.PI * 22) * amp]);
    }
    if (pts.length > 1) draw(pts, { c: C.green, w: 4, single: true, seed: 7 });
  }
  const tk = P(at(1, 0.15), 0.9);
  if (tk > 0) {
    line(x0, y + 120, lerp(x0, x1, eio(tk)), y + 120, { c: C.ink, w: 3 });
    for (let i = 0; i <= 5; i++) {
      const pp = clamp(tk * 6 - i);
      if (pp <= 0) continue;
      const tx = lerp(x0, x1, i / 5);
      line(tx, y + 120, tx, y + 120 + 22 * pp, { c: C.ink, w: 3 });
      txt(`${i * 12}s`, tx, y + 176, { size: 26, c: C.gray, p: pp });
    }
  }
  board(1);
  bl(0, '配音 Voice:', 0, lt, { c: C.gray, size: 32 });
  bl(1, '逐句合成，一段一句', at(0, 0.2), lt);
  bl(3, '起止时刻 → 时间轴', at(1, 0.2), lt, { c: C.green });
  bl(4, '30 帧 / 秒', at(1, 0.6), lt);
};

// 04: six frame thumbnails fill in, an arrow leads to the MP4 block
SC.render = (lt, S) => {
  const { P, at } = S;
  txt('第三步 · 逐帧渲染', 470, 160, { size: 58, p: P(0.1, 0.7) });
  const g = P(at(0, 0.2), Math.max(1.4, S.dur(0) * 0.8));
  const cols = 3, w = 110, h = 62, gx = 24, gy = 30, bx = 150, by = 360;   // keep the whole figure left of x=900
  for (let i = 0; i < 6; i++) {
    const pp = clamp(g * 6 - i);
    if (pp <= 0) continue;
    const cx = bx + (i % cols) * (w + gx), cy = by + Math.floor(i / cols) * (h + gy);
    grp(clamp(pp * 2), () => {
      fillPts([[cx, cy], [cx + w, cy], [cx + w, cy + h], [cx, cy + h]], '#fffdf7');
      box4(cx, cy, cx + w, cy + h, C.ink, pp);
      txt(`#${String(i + 1).padStart(3, '0')}`, cx + w / 2, cy + h / 2 + 8, { size: 22, c: C.gray });
    });
  }
  // the encode step: the block keeps growing across the whole line, so the figure never freezes
  const ap = P(at(1, 0.15), Math.max(1.0, S.dur(1) * 0.72));
  if (ap > 0) {
    arrow([[580, 455], [665, 455]], { c: C.red, w: 6, head: 18 });
    scaleAt(780, 455, 0.72 + 0.34 * eio(ap), () => {
      const x0 = 690, x1 = 870, y0 = 400, y1 = 510;
      fillPts([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], '#fffdf7');
      box4(x0, y0, x1, y1, C.red, clamp(ap * 3 - 0.4));
      txt('MP4', (x0 + x1) / 2, y0 + 42, { size: 42, c: C.red });
      const pw = (x1 - x0 - 32) * clamp(ap);
      fillPts([[x0 + 16, y1 - 30], [x0 + 16 + pw, y1 - 30], [x0 + 16 + pw, y1 - 14], [x0 + 16, y1 - 14]], C.red, 0.85);
    });
  }
  board(1);
  bl(0, '渲染 Render:', 0, lt, { c: C.gray, size: 32 });
  bl(1, '1920 × 1080', at(0, 0.2), lt);
  bl(2, '30 帧 / 秒', at(0, 0.6), lt);
  bl(4, 'ffmpeg 编码 MP4', at(1, 0.3), lt, { c: C.red });
};

// 05: three recap cards, then the "only two files change" line
SC.outro = (lt, S) => {
  const { P, at } = S;
  const cards = [
    ['脚本', '一句一件事', 'one idea per line', C.blue, 0.05],
    ['时间轴', '配音定节奏', 'voice sets the beat', C.green, 0.35],
    ['渲染', '逐帧合成', 'draw, then encode', C.red, 0.65],
  ];
  grp(1 - P(at(1), 0.5), () => {
    cards.forEach(([top, zh, en, col, f], i) => {
      const x = 400 + i * 560, y = 400, p = P(at(0, f), 0.7);
      if (p <= 0) return;
      scaleAt(x, y, back(p), () => {
        const pts = [[x - 225, y - 190], [x + 225, y - 187], [x + 228, y + 187], [x - 226, y + 191], [x - 225, y - 190]];
        fillPts(pts, '#fffdf7');
        draw(pts, { c: col, w: 5, seed: i });
        txt(top, x, y - 84, { size: 56, c: col });
        arrow([[x, y - 28], [x, y + 18]], { c: C.ink, w: 5, head: 14 });
        txt(zh, x, y + 76, { size: 50 });
        txt(en, x, y + 136, { size: 28, f: EN, c: C.gray });
      });
    });
  });
  grp(P(at(1), 0.5), () => {
    txt('换题材只改两个文件', 960, 690, { size: 60, pop: P(at(1, 0.3), 0.6) });
    txt('script.json + anim.js', 960, 768, { size: 44, f: MF, c: C.blue, pop: P(at(1, 0.6), 0.6) });
  });
};
