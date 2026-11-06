---
name: video-by-code
description: Use when asked to make a code-rendered explainer / walkthrough / concept video (讲解视频、科普片、原理动画、流程说明、产品讲解) for ANY topic from text, where the picture must be drawn precisely (diagrams, arrows, formulas, flow, timelines) with Chinese voice-over, bilingual zh+en subtitles and a hand-drawn canvas style, rendered to 1080p MP4. NOT for AI text-to-video, NOT for live-action or stock-footage editing, NOT for photo slideshows. For math / chemistry / physics problem solving (解题、例题精讲、错题讲解) use `edulab-pro` instead — it has solution cards, subject skins and a chemistry balancer.
---

# 代码化视频 (video-by-code)

把一段内容做成 1920×1080、带中文配音 + 中英双语字幕、手绘风格动画的 MP4。**画面不是模型生成的**：每一帧由 Canvas 指令画出来，所以文字永远清晰、几何永远精确、时长任意。

适用于"讲一个道理、说明一个流程、解释一个结构"。不适用于实拍、混剪、真人出镜。

```
script.json ──build_audio.py──► build/timeline.json + build/mix.wav + ../<name>.srt
     (旁白)      (TTS + 合成音乐)          │
anim.js + engine.js ◄─────────────────────┘  (按旁白时间点驱动动画)
     └──node render.mjs video──► ../<name>.mp4
```

**核心原则：画面跟着旁白走。** 每句旁白配一个动作，把要讲的事演出来。所有动画用 `S.at(k, f)` 定时（第 k 句旁白开始的时刻），**绝不写死秒数**。

## 目录

| 路径 | 作用 | 动不动 |
|---|---|---|
| `engine/engine.js` | 画布引擎：手绘笔触、文字、板书、字幕、道具 | **永不动** |
| `engine/build_audio.py` | 逐句 TTS、合成时间轴、混音、出 SRT | **永不动** |
| `engine/render.mjs` | Playwright 逐帧截图 → ffmpeg 编码 | **永不动** |
| `engine/index.html` + `fonts/` | 渲染入口与字体 | **永不动** |
| `templates/starter/` | 三个要重写的文件：`script.json`、`anim.js`、`storyboard.md` | 每片重写 |
| `reference/` | 脚本写法、读音、动画设计、引擎 API、排错 | 查阅 |
| `scripts/` | 建项目、环境自检、联系表、打包 | 共用 |

`SKILL` = 本文件所在目录，`WS` = 你当前所在目录（视频输出到这里），`PROJ` = 本片文件夹，`PY` = `setup_check.sh` 报的 python。

## 什么时候用这套方法

| 内容类型 | 合不合适 | 原因 |
|---|---|---|
| 原理 / 流程 / 结构图解 | ok | 图形精确，动作能演因果 |
| 公式、数据、时间轴 | ok | 数字和文字是字体渲染，不会糊 |
| 概念对比、三步法 | ok | 卡片与并置天然适合 |
| 实拍、真人、空镜 | no | 这条管线画不出真实质感 |
| 毛发、火焰、流体 | no | 靠像素堆的东西不适合矢量绘制 |
| 长时间线访谈 | no | 素材驱动，不是绘制驱动 |

## 十步

**退出码不是 0 就是没完成。** `--check` 退出码 1、`motion` 退出码 1、截图有问题，都要修好再往下走。

1. **定幕结构**：先把内容压成 4~6 幕，每幕 2~3 句。写在 `storyboard.md` 顶部（一句话目的 + 图形清单）。
2. **建项目、查环境**：
   ```bash
   bash SKILL/scripts/new_video.sh "$PWD" <ascii_folder_name>
   bash SKILL/scripts/setup_check.sh WS/<ascii_folder_name>
   ```
   缺 `GLM_API_KEY` 先问用户（见 `reference/glm-tts-setup.md`）；没有 key 也能用 edge-tts 兜底。
   **通过标准**：`ALL OK`。
3. **测 TTS**：`cd PROJ && PY build_audio.py --say "你好，我们来看一个东西。"`，生成了 wav 就过。
4. **写 `script.json`**（按 `reference/script-writing.md`）：一句一件事，每句 ≤ 36 字宽，数值带单位。
   `tts` 只写能念出来的中文：符号换口语（`½`→二分之一、`→`→到、`x²`→x 的平方）。
5. **写 `storyboard.md` 分镜**（按 `reference/visual-design.md`）：每句一行，写清 指 / 动 / 留。
   **通过标准**：每句一行；每句都有一个具体动作（首末幕可为 `—`）。
6. **过脚本检查**：`cd PROJ && PY build_audio.py --check`
   **通过标准**：`未固定读音的生僻字/多音字: 0` 且 `script errors: 0`，退出码 0。
7. **写 `anim.js`**：先读 `templates/starter/anim.js`，API 见 `reference/animation.md`。每幕一个 `SC.<id>`。
   **通过标准**：`node --check anim.js` 通过。
8. **免费预览**（不花钱，不生成音频）：
   ```bash
   cd PROJ && PY build_audio.py --preview && node render.mjs motion && node render.mjs stills auto && PY SKILL/scripts/contact_sheet.py .
   ```
   `motion` 报 `STATIC` 必须修：那句画面在整句里几乎没变。**逐张看 `build/sheet_*.png`**。
   **通过标准**：`motion check passed`，截图逐幕确认过。
9. **出配音、渲染**：
   ```bash
   cd PROJ && PY build_audio.py && node render.mjs video 6
   ```
   6 = 并行浏览器页数（不是帧率，帧率固定 30）。输出 `WS/<output_name>.mp4` 与 `.srt`。
10. **交付**：告诉用户路径、时长、每幕内容、结论；**说明你听不到音频，请用户试听**；列出标注过读音的字。

## 必须守的规则

1. **不要改 `engine.js`**。通用道具写在 `anim.js` 里；真想加通用件再说。
2. **时间只从 `S.at(k, f)` 取**。写死秒数会在重录旁白后全部错位。
3. **每句都要有贯穿整句的连续动作**。淡色填充、瞬时切换会被判 `STATIC`。有效手段：数值 `countTo` 贯穿、线条按 `p` 生长、`seed` 不同的重描。
4. **内容区 y ≤ 860**。y≈914~1044 是字幕带，画上去会被盖住。
5. **`tts` 字段必须能念**。数字、符号、字母缩写都要换成口语；`--check` 会拦。
6. **先预览再渲染**。`stills auto` + `contact_sheet` 是免费的，渲一遍视频要一分多钟。
7. **API key 只能由用户提供**。不打印 key，不去别的项目里翻 `.env`。

## 常见错误

| 错误做法 | 正确做法 |
|---|---|
| 改 `engine.js` 来适配某一片 | 只写 `anim.js` |
| 写死 `t=3.2` 秒 | `S.at(2, 0.4)` |
| 一上来就 `render.mjs video` | 先 `--preview` + `stills auto` 看画面 |
| 每句配"高亮一下"就算动作 | 高亮属于"指"，"动"要有几何变化 |
| 字幕写 `½ × 6 × 4`，tts 也这么写 | tts 写"二分之一乘以六乘以四" |
| 画面铺到 y=1000 | 控制在 860 以内 |
| 渲染完不看截图就交付 | 每次都看 `build/sheet*.png` |

## 参考文件
- `reference/script-writing.md`：脚本格式、幕的设计、口语写法对照。
- `reference/visual-design.md`：**动画怎么设计**：指→动→留、动作表，写分镜前必读。
- `reference/animation.md`：引擎 API、版面坐标、审查清单。
- `reference/pronunciation.md`：多音字与读音控制。
- `reference/glm-tts-setup.md`：智谱 TTS 配置；无 key 时的兜底。
- `reference/troubleshooting.md`：报错处理。

## 和 edulab-pro 的分工
- 本技能：任何题材的**讲解短片**，自己设计幕和动作。
- `edulab-pro`：数学 / 化学 / 物理**解题**视频，带解题卡、三套学科皮肤、化学配平校验、互动课件。
- 判断标准：**内容是"讲一个道理"还是"解一道题"**。后者用 `edulab-pro`。
