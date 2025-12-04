' Script para iniciar la aplicación y cerrar la terminal después de cargar
Set WshShell = CreateObject("WScript.Shell")

' Ejecutar npm run dev:electron en una ventana oculta
WshShell.Run "cmd /c cd /d """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & """ && npm run dev:electron", 0, False

' El script termina inmediatamente, cerrando cualquier ventana asociada
