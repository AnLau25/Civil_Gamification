@echo off
REM FE Arcade — start a local web server so the browser will load the modules.
REM Double click this file, then open http://localhost:8000
cd /d "%~dp0"
where py >nul 2>nul && (py -m http.server 8000 & goto :eof)
where python >nul 2>nul && (python -m http.server 8000 & goto :eof)
where npx >nul 2>nul && (npx --yes serve . -l 8000 & goto :eof)
echo Could not find Python or Node. Install either one, or just push to GitHub Pages.
pause
