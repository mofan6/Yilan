!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "MUI2.nsh"
!include "nsDialogs.nsh"

Var YilanParentDirectory
Var YilanParentField
Var YilanBrowseButton

Function YilanDirectoryPageCreate
  !insertmacro MUI_HEADER_TEXT "选择安装位置" "译澜会在所选位置自动创建 Yilan 子文件夹"
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${GetParent} "$INSTDIR" $YilanParentDirectory
  ${If} $YilanParentDirectory == ""
    StrCpy $YilanParentDirectory "$LOCALAPPDATA\Programs"
  ${EndIf}

  ${NSD_CreateLabel} 0 4u 100% 26u "请选择一个磁盘或父文件夹。选择磁盘根目录也可以，程序文件会统一放入其下的 Yilan 子文件夹。"
  Pop $0
  ${NSD_CreateText} 0 39u 76% 14u "$YilanParentDirectory"
  Pop $YilanParentField
  ${NSD_CreateBrowseButton} 78% 38u 22% 15u "浏览..."
  Pop $YilanBrowseButton
  ${NSD_OnClick} $YilanBrowseButton YilanBrowseDirectory
  ${NSD_CreateLabel} 0 67u 100% 18u "实际安装位置：所选文件夹\Yilan"
  Pop $0
  nsDialogs::Show
FunctionEnd

Function YilanBrowseDirectory
  ${NSD_GetText} $YilanParentField $0
  nsDialogs::SelectFolderDialog "选择译澜的父文件夹" "$0"
  Pop $1
  ${If} $1 != error
    ${NSD_SetText} $YilanParentField "$1"
  ${EndIf}
FunctionEnd

Function YilanDirectoryPageLeave
  ${NSD_GetText} $YilanParentField $YilanParentDirectory
  ${If} $YilanParentDirectory == ""
    MessageBox MB_ICONEXCLAMATION|MB_OK "请选择安装位置。"
    Abort
  ${EndIf}
  ${GetFileName} "$YilanParentDirectory" $0
  ${If} $0 == "Yilan"
    StrCpy $INSTDIR "$YilanParentDirectory"
  ${ElseIf} $0 == "译澜"
    StrCpy $INSTDIR "$YilanParentDirectory"
  ${Else}
    StrCpy $INSTDIR "$YilanParentDirectory\Yilan"
  ${EndIf}
FunctionEnd

!macro customPageAfterChangeDir
  Page custom YilanDirectoryPageCreate YilanDirectoryPageLeave
!macroend

!macro customUnWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "卸载译澜"
  !define MUI_WELCOMEPAGE_TEXT "此向导将完整移除译澜程序、离线模型以及安装时创建的快捷方式。你的本机偏好默认保留，便于以后重新安装。$\r$\n$\r$\n单击“下一步”开始卸载。"
  !insertmacro MUI_UNPAGE_WELCOME
!macroend

!macro customInstall
  Delete "$LOCALAPPDATA\${APP_INSTALLER_STORE_FILE}"
  RMDir "$LOCALAPPDATA\yilan-offline-translator-updater"
  SetShellVarContext all
  Delete "$DESKTOP\译澜.lnk"
  SetShellVarContext current
  CreateShortCut "$DESKTOP\译澜.lnk" "$INSTDIR\Yilan.exe" "" "$INSTDIR\resources\icons\aurora.ico" 0 SW_SHOWNORMAL "" "译澜 · 离线中英翻译"
  CreateShortCut "$SMPROGRAMS\译澜.lnk" "$INSTDIR\Yilan.exe" "" "$INSTDIR\resources\icons\aurora.ico" 0 SW_SHOWNORMAL "" "译澜 · 离线中英翻译"
  ${If} $installMode == "all"
    SetShellVarContext all
  ${EndIf}
!macroend

!macro customUnInstall
  SetShellVarContext current
  Delete "$DESKTOP\译澜.lnk"
  Delete "$SMPROGRAMS\译澜.lnk"
  SetShellVarContext all
  Delete "$DESKTOP\译澜.lnk"
  Delete "$SMPROGRAMS\译澜.lnk"
  ${If} $installMode == "current"
    SetShellVarContext current
  ${EndIf}
!macroend
