!include "MUI2.nsh"

Name "Yazif"
OutFile "Yazif-Setup.exe"
InstallDir "$LOCALAPPDATA\Yazif"
InstallDirRegKey HKCU "Software\Yazif" "InstallDir"
RequestExecutionLevel user
Unicode True

!define MUI_ABORTWARNING
!define MUI_ICON "assets\icon.ico"
!define MUI_UNICON "assets\icon.ico"

!define MUI_WELCOMEPAGE_TITLE "Welcome to Yazif"
!define MUI_WELCOMEPAGE_TEXT "A clean, modern YouTube downloader with Catppuccin theming.$\r$\n$\r$\nClick Next to continue."

!define MUI_FINISHPAGE_RUN "$INSTDIR\Yazif.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Yazif"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install"
    SetOutPath "$INSTDIR"
    File "dist\Yazif.exe"
    WriteRegStr HKCU "Software\Yazif" "InstallDir" "$INSTDIR"
    WriteUninstaller "$INSTDIR\Uninstall.exe"

    CreateDirectory "$SMPROGRAMS\Yazif"
    CreateShortCut "$SMPROGRAMS\Yazif\Yazif.lnk" "$INSTDIR\Yazif.exe"
    CreateShortCut "$SMPROGRAMS\Yazif\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
    CreateShortCut "$DESKTOP\Yazif.lnk" "$INSTDIR\Yazif.exe"
SectionEnd

Section "Uninstall"
    Delete "$INSTDIR\Yazif.exe"
    Delete "$INSTDIR\Uninstall.exe"
    RMDir "$INSTDIR"
    Delete "$SMPROGRAMS\Yazif\Yazif.lnk"
    Delete "$SMPROGRAMS\Yazif\Uninstall.lnk"
    RMDir "$SMPROGRAMS\Yazif"
    Delete "$DESKTOP\Yazif.lnk"
    DeleteRegKey HKCU "Software\Yazif"
SectionEnd
