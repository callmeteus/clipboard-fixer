@echo off
setlocal

:: Define the path to the script
set "ScriptPath=%CD%/fix-links.bat"

:: Define the path to the startup folder
set "StartupFolder=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "ShortcutFile=%StartupFolder%\Embed Links Fixer.lnk"

echo Creating the embed links fixer shortcut...

echo The script path is: %ScriptPath%
echo The startup folder is: %StartupFolder%
echo The shortcut file is: %ShortcutFile%

:: Create the batch file in the startup folder
echo Set objShell = WScript.CreateObject("WScript.Shell") > temp.vbs
echo Set objShortcut = objShell.CreateShortcut("%ShortcutFile%") >> temp.vbs
echo objShortcut.TargetPath = "%ScriptPath%" >> temp.vbs
echo objShortcut.WorkingDirectory = "%~dp0" >> temp.vbs
echo objShortcut.Save >> temp.vbs

:: Executar o script VBS para criar o atalho
cscript //nologo temp.vbs
del temp.vbs

echo The embed links fixer shortcut has been created successfully!
pause