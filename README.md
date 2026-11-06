# video-by-code

用代码逐帧画出来的讲解视频。**不是文生视频模型**：每一帧由 Canvas 指令画出来，所以文字永远清晰、几何永远精确、时长任意。

输入是几句旁白 + 一个动画脚本，输出是 1920×1080 / 30fps 的 MP4，带中文配音和中英双语字幕。

> 渲染引擎源自 [wy51ai/edulab](https://github.com/wy51ai/edulab)（Apache-2.0，Copyright 2026 WY @akokoi1）。本仓库做的是把它从学科解题里拆出来，变成任何题材都能用的通用版。

## 为什么不用 AI 生成

| | 文生视频模型 | 本方案 |
|---|---|---|
| 像素怎么来 | 模型预测 | 代码绘制 |
| 文字 | 常糊、会变形 | 真实字体渲染，放大到 4K 不糊 |
| 几何精度 | 大致像 | 坐标精确，写 5 就是 5 |
| 时长 | 几秒到十几秒 | 任意，已跑过 71 秒 |
| 改动 | 重新生成，结果不可控 | 改一处只变一处 |
| 可控粒度 | 提示词级 | 第几句、哪条线 |

代价是它只能做"画得准"的内容：图解、流程、原理、公式、时间轴。实拍、真人、流体火焰这类靠像素堆的东西做不了。

## 快速开始

### 1. 依赖

```bash
# Node 侧：渲染用（~93 MB，装一次，所有视频项目复用）
npm install

# Python 侧：配音、时间轴、题图
python -m pip install --user numpy requests pypinyin pillow
python -m pip install --user edge-tts        # 免费兜底配音，可选的
```

还需要 **Node 18+**、**Python 3.11+**、以及本机装了 **Google Chrome**（用它的渲染能力，不必再下 300 MB 的 Chromium）。

自检：

```bash
bash scripts/setup_check.sh .
```

全绿（`ALL OK`）才继续。

### 2. 建一个视频项目

```bash
bash scripts/new_video.sh "$PWD" my-first-video
```

会在当前目录建 `my-first-video/`，里面已经放好引擎和一份可运行的示例。

### 3. 改两个文件

| 文件 | 改什么 |
|---|---|
| `script.json` | 旁白：每句 `zh`（字幕）/ `tts`（念出来的话）/ `en`（英文） |
| `anim.js` | 动画：每幕一个 `SC.<id>` 函数，时间全部锚在 `S.at(k, f)` |

`storyboard.md` 是分镜表，`build_audio.py --check` 会核对它和 `script.json` 是否一一对应。

### 4. 免费预览

```bash
cd my-first-video
python build_audio.py --preview      # 只算时间轴，不调 TTS
node render.mjs motion               # 检查每句画面是否在动
node render.mjs stills auto          # 逐句截图
python ../scripts/contact_sheet.py . # 拼成联系表
```

看 `build/sheet*.png`，满意了再花钱出声。

### 5. 出片

```bash
python build_audio.py                # 配音 + 混音 + 出 SRT
node render.mjs video 6              # 6 = 并行浏览器页数，不是帧率
```

成品写到**上一级目录**：`<output_name>.mp4` 和 `.srt`。

## 目录

```
engine/                 五个永远不用改的件
  engine.js             画布引擎：手绘笔触、文字、板书、字幕、道具
  build_audio.py        逐句 TTS、合成时间轴、混音、出 SRT
  render.mjs            Playwright 逐帧截图 → ffmpeg 编码
  index.html            渲染入口
  fonts/                手写体（Patrick Hand / ZCOOL KuaiLe）
templates/starter/      每片要重写的三个文件
  script.json           旁白与字幕
  anim.js               这一片的图形与动作
  storyboard.md         分镜：每句的 指 / 动 / 留
reference/              六篇方法论：脚本、读音、动画设计、引擎 API、排错、TTS
scripts/                建项目、自检、联系表、打包
shared/                 读音词表（pron.py + pron.json）
```

## 工作流

1. 定幕结构（4~6 幕，每幕 2~3 句）
2. 建项目、查环境
3. 测一句 TTS
4. 写 `script.json`
5. 写 `storyboard.md` 分镜
6. `--check`：读音和分镜都过
7. 写 `anim.js`
8. `--preview` + `motion` + `stills` 免费预览
9. 出配音、渲染
10. 打包（`scripts/package_video.sh`）

## 配音

默认用智谱 GLM-TTS（音质好，还能自动听写核对字幕）。在 `~/.config/math-problem-video/.env` 写一行：

```
GLM_API_KEY=你的key
```

没有 key 也能用，会自动退回免费的 edge-tts（晓晓，需联网）。三档引擎：`TTS_ENGINE=auto|glm|edge|say`。

## 两个容易踩的坑

- **`motion` 只统计左半区（x<900）**。动作画在右侧板书区，画面在动也会被判 `STATIC`。
- **内容幕标题不要放 `x=960`**。板书从 930 开始，会盖住标题，放 `x=470` 左右。

更多见 `reference/animation.md` 和 `reference/troubleshooting.md`。

## 来源与许可

本仓库的渲染与配音引擎（`engine/` 目录）来自 **[wy51ai/edulab](https://github.com/wy51ai/edulab)**，Copyright 2026 WY ([@akokoi1](https://github.com/akokoi1))，**Apache License 2.0**。原始 `LICENSE` 与 `NOTICE` 已随仓库保留，请一并保留。

核对依据：本仓库 `engine/engine.js` 与上游 `skills/edu-math-video/template/engine.js` 逐行比对，664 行中仅末尾 25 行不同（上游后续新增了交互式预览：空格播放、←/→ 跳 5 秒）。取自较早的快照。

### 相对上游的改动

| 文件 | 改动 |
|---|---|
| `scripts/new_video.sh` | 去掉学科参数（通用化）；引擎改为从 `engine/` 复制；Windows 适配（junction 复用依赖、symlink 失败判空回退复制） |
| `scripts/setup_check.sh` | 补 Windows 下的 Chrome 检测路径，避免误报「没有 Chrome」 |
| `scripts/package_courseware.sh` → `scripts/package_video.sh` | 换成只打视频 + 字幕的版本（去掉互动课件部分） |
| `templates/starter/` | 全新，通用示例（讲“代码化视频”本身，不含任何学科内容） |
| `SKILL.md`、`reference/` 部分 | 通用化改写，去掉解题卡与学科专属流程 |

上游是**三个学科解题技能**（`edu-math-video` / `edu-chem-video` / `edu-physics-video`），本仓库把其中的通用引擎抽出来，与学科解耦。

### 字体

`engine/fonts/` 内为 [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand) 与 [ZCOOL KuaiLe](https://fonts.google.com/specimen/ZCOOL+KuaiLe)，均为 **SIL Open Font License 1.1**，可自由使用与再分发；公开发布时建议随附 OFL 许可证文本。

### 上游更新

上游仍在维护，想拿最新引擎可以直接装：

```bash
npx skills add wy51ai/edulab
```

