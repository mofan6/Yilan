# 构建译澜

## 环境

- Windows 10/11 x64
- Node.js 22 或更高版本
- npm
- .NET Framework 4.8 / Visual Studio Build Tools（编译 WPF 外层安装器）
- 约 6 GiB 可用磁盘空间

## 仓库未包含的资源

为避免把大文件写入 Git 历史，并遵守第三方许可，仓库不包含以下资源：

- `base-unpacked/resources/models/Hy-MT2-1.8B-Q6_K.gguf`
- `base-unpacked/resources/data/dictionary.sqlite3`
- `base-unpacked/resources/icons/*.ico`
- `runtime-vulkan/` 与 `runtime-cpu/` 中的 llama.cpp 运行库

模型来自 [Tencent Hy-MT2-1.8B-GGUF](https://huggingface.co/tencent/Hy-MT2-1.8B-GGUF)，按 Apache License 2.0 提供；构建与分发前请阅读 [Hy-MT2 许可](app/third_party/HY-MT2-LICENSE.txt)。

llama.cpp 运行库应取自其官方 Windows Vulkan 与 CPU 发布包。运行库目录至少需包含 `llama-server.exe` 及 `app/package.json` 中 `extraResources` 所列 DLL 和许可证文件。

## 构建 Electron 主程序

```powershell
cd app
npm install
npm run dist
```

生成的 NSIS 安装包位于 `app/dist/`。`app/build/installer.nsh` 负责安装路径、快捷方式与卸载行为。

## 组合现代安装器

`modern-installer/` 保存 WPF 外层安装器源码。使用 Visual Studio Build Tools / .NET Framework 编译 `Program.cs` 与 `InstallerWindow.xaml`，生成 `YilanInstallerStub.exe` 后执行：

```powershell
node modern-installer/compose-installer.cjs `
  modern-installer/YilanInstallerStub.exe `
  app/dist/译澜-完整离线安装包-v1.6.0.exe `
  译澜-完整离线安装包-v1.6.0.exe
```

组合过程不会改变 NSIS 载荷，只在 WPF 启动器后附加安装载荷及固定 32 字节索引尾部。

## 发布前检查

- 在独显、集显与 CPU 回退环境分别验证翻译。
- 确认首次启动教程只出现一次，首次主题随机，之后不覆盖用户偏好。
- 确认切换主题会更新桌面快捷方式图标。
- 从磁盘根目录与普通文件夹分别安装，再通过 Windows“已安装的应用”卸载。
- 确认安装目录含 `resources/licenses/NOTICE.txt` 和完整第三方许可。
- 计算最终安装包 SHA-256，并写入 Release 说明。
