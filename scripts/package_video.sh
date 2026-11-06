#!/usr/bin/env bash
# Collect the rendered mp4 + srt into <project>/视频版/ and zip the project for sharing.
#   bash package_video.sh <project_dir>
# Reads output_name from episode.json; the mp4/srt are expected next to the project folder.
set -euo pipefail
P="$(cd "${1:-.}" && pwd -P)"; WS="$(cd "$P/.." && pwd -P)"; NAME="$(basename "$P")"

# [Windows local] Windows Python cannot resolve Git Bash paths like /e/00_work/... : convert first.
PW="$(cygpath -w "$P" 2>/dev/null || echo "$P")"
WC="$(cygpath -w "$WS" 2>/dev/null || echo "$WS")"
WZIP="$(cygpath -w "$WS/$NAME" 2>/dev/null || echo "$WS/$NAME")"

OUT="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8'))['output_name'])" "$PW/episode.json")"
TITLE="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8')).get('title',''))" "$PW/episode.json")"

[ -f "$WS/$OUT.mp4" ] || { echo "ERROR: $WS/$OUT.mp4 not found. Render first: node render.mjs video 6"; exit 1; }
mkdir -p "$P/视频版"
cp "$WS/$OUT.mp4" "$P/视频版/"
[ -f "$WS/$OUT.srt" ] && cp "$WS/$OUT.srt" "$P/视频版/"

cat > "$P/README.md" <<EOF
# $TITLE

自包含视频包。

| 路径 | 内容 |
|---|---|
| \`视频版/$OUT.mp4\` | 成片，1920×1080 / 30fps |
| \`视频版/$OUT.srt\` | 中英双语字幕 |
| \`script.json\` | 旁白与字幕（改内容从这里开始） |
| \`anim.js\` | 这一片的动画（改画面从这里开始） |
| \`storyboard.md\` | 分镜：每句的指 / 动 / 留 |
| \`episode.json\` | 标题与输出文件名 |
| \`build/\` | 中间产物（时间轴、音频片段、截图） |

改内容后重出：
\`\`\`bash
PY build_audio.py --check && PY build_audio.py && node render.mjs video 6
\`\`\`
EOF

python3 -c "import shutil;shutil.make_archive(r'''$WZIP''','zip',r'''$WC''','$NAME')" && echo "created $WS/$NAME.zip"
echo "done: $P/视频版/ + README.md"
