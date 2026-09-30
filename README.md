<div align="center">

# 译澜 Yilan · Windows 离线翻译、截图 OCR 与文档翻译

**让语言，在本地自然流动。**

一款面向 Windows 的 **38 语言离线翻译器**：支持文本互译、截图 OCR、图片翻译、PDF / Word / Excel / PowerPoint 文档翻译与中英逐词释义，使用本机 GPU 或 CPU 推理。

**Offline translator for Windows with 38 languages, screenshot OCR, image translation, and document translation**, powered by Tencent Hy-MT2 and llama.cpp. Text, images, and documents are processed on your own computer.

![版本](https://img.shields.io/badge/version-v1.8.0-6f73ff)
![平台](https://img.shields.io/badge/Windows-10%2F11-36a7ff)
![离线](https://img.shields.io/badge/inference-offline-20c9a7)

</div>

> [!IMPORTANT]
> 完整离线版内置 Tencent Hy-MT2-1.8B GGUF Q6_K 模型，按 Apache License 2.0 提供。下载或使用完整安装包前，请阅读 [Hy-MT2 许可](app/third_party/HY-MT2-LICENSE.txt)。

**[下载译澜 v1.8.0 · Windows 完整离线安装包](https://github.com/mofan6/Yilan/releases/download/v1.8.0/Yilan-v1.8.0-Hy-MT2-Q6_K-Setup.exe)** · [更新记录](CHANGELOG.md) · [所有版本 / Releases](https://github.com/mofan6/Yilan/releases) · [源码构建](BUILDING.md) · [反馈问题](https://github.com/mofan6/Yilan/issues)

安装包约 **1.744 GiB**，已包含翻译模型、OCR 资源、词典与 GPU / CPU 推理组件。下载链接使用稳定的英文文件名，与原始中文名安装包的内容完全一致。

## 界面预览

以下截图展示主界面与个性化设置，来自早期版本；v1.8.0 新增的截图 OCR 和文档工作台见下方功能说明。

![译澜主界面](docs/screenshots/main-dark.png)

![译澜个性化设置](docs/screenshots/preferences.png)

## 功能

- Hy-MT2 官方支持的 38 种语言可相互翻译，文本不上传
- 源语言自动识别，目标语言自由选择；支持搜索、收藏、最近使用与快速交换
- **截图 OCR 翻译**：使用截图按钮或 `Alt+Q` 框选屏幕内容，也可导入图片或识别剪贴板图片
- **文档翻译**：支持 TXT、Markdown、DOCX、PPTX、XLSX、数字 PDF 与扫描 PDF
- **本地文档阅读器**：支持划词翻译、缩放、拖拽浏览与译文打开，改进 PDF 版面回写
- 主窗口优先显示，模型、词典、OCR 与截图组件错峰预热，配有主题同步的启动进度窗口
- Vulkan 独显 / 集显推理，并在不可用时自动回退 CPU
- 点击原文或译文中已收录的中文、英文词语查看本地逐词释义
- 八种主题色、亮暗模式、可调玻璃倾斜角度
- 默认橘影橙主题，全窗口新手引导仅在首次使用时展示，之后保留用户偏好
- 主题色同步生成桌面快捷方式图标
- GPU 合成的玻璃、悬浮、圆形主题揭示与微动效
- 支持磁盘根目录或任意父文件夹安装，并自动创建 `Yilan` 子目录
- 单实例运行，重复双击快捷方式会唤醒已有窗口；关闭主窗口后完整退出

翻译支持的语言范围与 OCR 识别语言范围不同。扫描清晰度、字体和复杂排版会影响 OCR 与文档回写效果，重要文档请检查输出。

## 安装与使用

> 完整安装包包含约 1.37 GiB 的 Tencent Hy-MT2-1.8B GGUF Q6_K 模型，因此作为 Release 资产提供，不直接写入源码仓库。

1. [下载 `Yilan-v1.8.0-Hy-MT2-Q6_K-Setup.exe`](https://github.com/mofan6/Yilan/releases/download/v1.8.0/Yilan-v1.8.0-Hy-MT2-Q6_K-Setup.exe)，如需核验完整性，可下载 [SHA256SUMS.txt](https://github.com/mofan6/Yilan/releases/download/v1.8.0/SHA256SUMS.txt)。
2. 运行安装器，选择磁盘或父文件夹；译澜会自动创建 `Yilan` 子文件夹。
3. 安装完成后，从桌面快捷方式启动译澜；安装器不会自动打开软件。首次启动会展示一次新手教程，并错峰预热本地组件。
4. 输入句子，选择源语言（或自动检测）和目标语言后翻译；点击已收录的中文或英文词语可查看本地释义。

完整包为 **1,872,644,069 字节（约 1.744 GiB）**，已包含模型、OCR 资源、词典、Vulkan 与 CPU 推理运行库，新电脑安装后无需联网下载组件。适用于 Windows 10/11 x64。

截图和图片翻译可从主界面的相关入口使用；整份文件请使用文档翻译工作台。完整更新说明见 [v1.8.0 发布说明](RELEASE_NOTES_v1.8.0.md)。

## 硬件兼容

| 设备 | 推理路径 | 说明 |
|---|---|---|
| NVIDIA / AMD / Intel 独显 | Vulkan | 优先使用可用独显 |
| Intel / AMD 集显 | Vulkan | 可用时自动选择 |
| 无可用 Vulkan 设备 | CPU | 自动回退，不要求独立显卡 |

右上角状态只显示当前实际采用的推理类型，并保留绿色就绪指示灯。

## 从源码构建

仓库只保存应用和安装器源码，不把模型、词典数据库、Electron/llama.cpp 二进制及构建产物写入 Git 历史。准备这些资源和构建环境的步骤见 [BUILDING.md](BUILDING.md)。

## 数据与隐私

- 文本翻译、截图 OCR、图片识别、文档翻译与查词均在本机完成。
- 不上传输入内容，不依赖云端翻译或 OCR API。
- 设置保存在当前 Windows 用户的本地应用数据目录中。

## 第三方组件与许可

- [Tencent Hy-MT2](https://huggingface.co/tencent/Hy-MT2-1.8B-GGUF) — Apache License 2.0
- [llama.cpp](https://github.com/ggml-org/llama.cpp) — MIT License
- [franc-min](https://github.com/wooorm/franc) — MIT License
- [flag-icons](https://github.com/lipis/flag-icons) — MIT License
- RapidOCR-json / PaddleOCR 模型 — 各自的 MIT / Apache License 2.0
- [Tesseract.js](https://github.com/naptha/tesseract.js) / tessdata — Apache License 2.0
- [ECDICT](https://github.com/skywind3000/ECDICT) — MIT License
- [CC-CEDICT](https://cc-cedict.org/) — CC BY-SA 4.0
- Electron / Chromium / Node.js — 各自许可证

详细归属与声明见 [NOTICE.txt](app/third_party/NOTICE.txt)。译澜由 **MOFAN** 提供；Tencent 与本项目不存在隶属、关联、赞助或认可关系。

## English quick start

**Yilan v1.8.0** is a Windows 10/11 x64 desktop app for offline translation across 38 languages. It uses Tencent Hy-MT2-1.8B GGUF Q6_K through llama.cpp, with Vulkan GPU acceleration and CPU fallback.

- Translate text, capture screenshots with `Alt+Q`, or import/paste images for local OCR and translation.
- Translate TXT, Markdown, DOCX, PPTX, XLSX, text PDFs and scanned PDFs in the document workspace.
- Read documents locally with selection translation, zoom and pan. The built-in dictionary covers recorded Chinese and English entries.

Read the [Hy-MT2 license](app/third_party/HY-MT2-LICENSE.txt), download the [v1.8.0 offline installer](https://github.com/mofan6/Yilan/releases/download/v1.8.0/Yilan-v1.8.0-Hy-MT2-Q6_K-Setup.exe), install it, and launch Yilan from the desktop shortcut. The **1.744 GiB** installer includes the model, OCR resources, dictionaries, and GPU/CPU runtimes. A [SHA-256 checksum file](https://github.com/mofan6/Yilan/releases/download/v1.8.0/SHA256SUMS.txt) is available.

Translation language support and OCR script support differ; recognition quality and complex document layout can affect results. See [release notes](RELEASE_NOTES_v1.8.0.md) and [BUILDING.md](BUILDING.md) for details. App source is published for inspection without a general license to copy, modify, redistribute, or use it commercially; third-party components retain their own licenses.

## 应用源码权利

Copyright © 2026 MOFAN. All rights reserved.

本仓库公开源码用于查看、审阅与问题反馈；除第三方组件各自许可明确授予的权利外，未授予复制、修改、再分发或商业使用译澜应用代码的许可。

---

<div align="center">Designed By MOFAN</div>
