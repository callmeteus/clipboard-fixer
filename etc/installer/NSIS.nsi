; Clipboard Fixer Installer
Outfile "out\clipboard-fixer-installer.exe"

# Let's target %APPDATA% instead of %PROGRAMFILES% because the `config` is editable
# and `Program Files` requires admin privileges
InstallDir "$APPDATA\Clipboard Fixer"
RequestExecutionLevel admin
ShowInstDetails show

Name "Clipboard Fixer"
Caption "Clipboard Fixer"
BrandingText "Copyright 2025 Gio Pavanelli"

; Include Modern UI 2
!include "MUI2.nsh"

# Set the icon
!define MUI_ICON "../../assets/icon-enabled.ico"

; Installer Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "../../LICENSE"
!insertmacro MUI_PAGE_DIRECTORY

; Start Menu Configuration
!define MUI_STARTMENUPAGE_DEFAULTFOLDER "Clipboard Fixer"
!define MUI_STARTMENUPAGE_NODISABLE
Var StartMenuFolder
!insertmacro MUI_PAGE_STARTMENU Application $StartMenuFolder

!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

Section "Install"
    # Set the installation directory
    SetOutPath "$INSTDIR"

    # Standard configuration files
    File /oname=$OUTDIR\config\replacers\embeddables.json ..\..\config\replacers\embeddables.json

    # Main executable
    File ..\..\out\clipboard-fixer.exe

    ; Create Start Menu Shortcut
    CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
    CreateShortcut "$SMPROGRAMS\$StartMenuFolder\Clipboard Fixer.lnk" "$INSTDIR\clipboard-fixer.exe"

    ; Ask if user wants to enable startup
    MessageBox MB_YESNO "Enable Clipboard Fixer on startup?" IDNO skip_startup
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ClipboardFixer" "$INSTDIR\clipboard-fixer.exe"
    skip_startup:

    ; Create Uninstaller
    WriteUninstaller "$INSTDIR\uninstall.exe"

    ; Register Uninstaller in Control Panel
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ClipboardFixer" "DisplayName" "Clipboard Fixer"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ClipboardFixer" "UninstallString" "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
    ; Remove Installed Files
    Delete "$INSTDIR\clipboard-fixer.exe"
    Delete "$INSTDIR\uninstall.exe"

    ; Remove from Startup
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ClipboardFixer"

    ; Remove Start Menu Entry
    Delete "$SMPROGRAMS\$StartMenuFolder\Clipboard Fixer.lnk"
    RMDir "$SMPROGRAMS\$StartMenuFolder"

    ; Remove Installation Directory
    RMDir "$INSTDIR"

    ; Remove Uninstaller Entry
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ClipboardFixer"
SectionEnd

; Set Installer Language
!insertmacro MUI_LANGUAGE "English"
