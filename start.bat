@echo off
setlocal
cd /d "%~dp0"

if exist "release\win-unpacked\Multi-Platform Chat Manager.exe" (
    start "" "release\win-unpacked\Multi-Platform Chat Manager.exe"
    exit /b
)

echo Executable not found. Starting in development mode...
if exist "start_dev.vbs" (
    start /min "" wscript.exe "start_dev.vbs"
) else (
    npm run dev:electron
)
endlocal
