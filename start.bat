@echo off
setlocal
cd /d "%~dp0"

REM 1. Try to run the compiled executable if it exists
if exist "release\win-unpacked\Multi-Platform Chat Manager.exe" (
    start "" "release\win-unpacked\Multi-Platform Chat Manager.exe"
    exit /b
)

REM 1b. Try to run the portable executable if it exists
for %%f in ("release\Multi-Platform Chat Manager *.exe") do (
    echo %%f | findstr /i "Setup" >nul
    if errorlevel 1 (
        echo Encontrado ejecutable portable: %%f
        start "" "%%f"
        exit /b
    )
)

REM 2. If no executable, we are running from source. Check for Node.js.
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js no esta instalado.
    echo Para ejecutar el codigo fuente, necesitas instalar Node.js.
    echo O descarga la version compilada (carpeta release) si la tienes disponible.
    pause
    exit /b
)

REM 3. Check if dependencies are installed
if not exist "node_modules" (
    echo Detectada primera ejecucion. Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo Hubo un error instalando las dependencias.
        pause
        exit /b
    )
)

echo Iniciando en modo desarrollo...
if exist "start_dev.vbs" (
    start /min "" wscript.exe "start_dev.vbs"
) else (
    npm run dev:electron
)
endlocal
