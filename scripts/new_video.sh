#!/usr/bin/env bash
# Create a new code-rendered video project.
#   bash new_video.sh <workspace_root> <folder_name>
# workspace_root = the directory the USER is working in (normally "$PWD"); mp4/srt land there.
# The engine (engine.js / build_audio.py / render.mjs / index.html / fonts) is copied in from
# <skill>/engine/, so a project is self-contained and the skill can be upgraded independently.
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd -P)"
[ $# -eq 2 ] || { echo "usage: bash new_video.sh <workspace_root> <folder_name>"; exit 2; }
WS="$(cd "$1" && pwd -P)"; NAME="$2"
[[ "$NAME" =~ ^[A-Za-z0-9_-]+$ ]] || { echo "folder_name must be ASCII letters/digits/-/_ (got '$NAME')"; exit 2; }

DEST="$WS/$NAME"
[ -e "$DEST" ] && { echo "ERROR: $DEST already exists. Pick another name; never overwrite a finished video."; exit 1; }

mkdir -p "$DEST"
cp -R "$SKILL/templates/starter/." "$DEST/"                       # the files you rewrite: script.json / anim.js / episode.json
cp "$SKILL/engine/engine.js" "$SKILL/engine/build_audio.py" \
   "$SKILL/engine/render.mjs" "$SKILL/engine/index.html" "$DEST/"  # the files you never touch
cp -R "$SKILL/engine/fonts" "$DEST/"
mkdir -p "$DEST/build"

# [Windows local] Git Bash often cannot create real symlinks ("Operation not permitted"), and a failed
# `ln -s` leaves a 0-byte file behind — so test with -s (exists AND non-empty), then fall back to cp.
for f in pron.py pron.json; do
  if [ ! -s "$WS/$f" ]; then
    if ln -s "$SKILL/shared/$f" "$WS/$f" 2>/dev/null && [ -s "$WS/$f" ]; then
      echo "linked $WS/$f -> skill shared/$f"
    else
      cp "$SKILL/shared/$f" "$WS/$f"; echo "copied $WS/$f from skill shared/$f (no symlink permission)"
    fi
  fi
done

# node_modules: reuse a shared install instead of the ~93 MB npm download per workspace
if [ ! -e "$WS/node_modules/playwright" ] || [ ! -e "$WS/node_modules/ffmpeg-static" ]; then
  NM=""; d="$SKILL"
  while [ "$d" != "/" ]; do
    [ -e "$d/node_modules/playwright" ] && [ -e "$d/node_modules/ffmpeg-static" ] && { NM="$d/node_modules"; break; }
    d="$(dirname "$d")"
  done
  if [ -n "$NM" ] && [ ! -e "$WS/node_modules" ]; then
    # a directory junction is zero-copy, and MSYS `rm -rf` on a junction deletes only the link
    if ln -s "$NM" "$WS/node_modules" 2>/dev/null; then
      echo "linked $WS/node_modules -> $NM (shared install, nothing copied)"
    elif command -v cmd.exe >/dev/null 2>&1 &&
         cmd //c mklink //J "$(cygpath -w "$WS/node_modules")" "$(cygpath -w "$NM")" >/dev/null 2>&1; then
      echo "junctioned $WS/node_modules -> $NM (zero copy)"
    else
      cp -R "$NM" "$WS/node_modules"; echo "copied node_modules from $NM"
    fi
  elif [ -n "$NM" ]; then
    echo "NOTE: $WS/node_modules exists but is missing playwright/ffmpeg-static; run: cd \"$WS\" && npm install"
  else
    if [ ! -e "$WS/package.json" ]; then
      cat > "$WS/package.json" <<'JSON'
{
  "name": "code-rendered-videos",
  "private": true,
  "dependencies": { "ffmpeg-static": "^5.3.0", "playwright": "1.49" }
}
JSON
    fi
    echo "NOTE: no playwright/ffmpeg-static found. Run once: cd \"$WS\" && npm install"
  fi
fi

echo "created $DEST   (video will be written to $WS/)"
echo "next: bash $SKILL/scripts/setup_check.sh $DEST"
