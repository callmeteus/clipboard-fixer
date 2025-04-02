@echo off
setlocal

:: Define the path to the script
set "ScriptPath=%CD%/fix-links.bat"

:: Define the path to the startup folder
set "StartupFolder=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "ShortcutFile=%StartupFolder%\Embed Links Fixer.lnk"

echo Removing the embed links fixer shortcut...

echo The script path is: %ScriptPath%
echo The startup folder is: %StartupFolder%
echo The shortcut file is: %ShortcutFile%

:: Remove the batch file from the startup folder
if exist "%ShortcutFile%" (
    del "%ShortcutFile%"
    echo The embed links fixer shortcut has been removed successfully!
) else (
    echo The embed links fixer shortcut does not exist.
)

pause