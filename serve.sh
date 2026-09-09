#!/usr/bin/env bash
# FE Arcade — start a local web server so the browser will load the modules.
# Then open http://localhost:8000
cd "$(dirname "$0")"
if command -v python3 >/dev/null; then exec python3 -m http.server 8000; fi
if command -v python  >/dev/null; then exec python  -m http.server 8000; fi
if command -v npx     >/dev/null; then exec npx --yes serve . -l 8000; fi
echo "Install Python or Node, or just push to GitHub Pages."
