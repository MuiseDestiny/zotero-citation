# Zotero Citation

<img src="addon/chrome/content/icons/favicon.png" alt="Zotero Citation" width="64">

[English](README.md) | **简体中文** | [Русский](README.ru.md) | [Français](README.fr.md)

[![Latest release](https://img.shields.io/github/v/release/MuiseDestiny/zotero-citation)](https://github.com/MuiseDestiny/zotero-citation/releases)
[![Downloads](https://img.shields.io/github/downloads/MuiseDestiny/zotero-citation/total?color=yellow)](https://github.com/MuiseDestiny/zotero-citation/releases)
[![License](https://img.shields.io/github/license/MuiseDestiny/zotero-citation)](LICENSE)

在 Zotero 中查看 Word 文档引用了哪些文献，并通过快捷键或拖拽直接插入引用。

Easier Citation connects your Zotero library with Microsoft Word: browse cited items by document, see their citation labels, and insert citations with a keystroke or drag-and-drop.

## 功能一览

| 功能             | 说明                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| 按文档归类       | 为 Word 引用会话创建临时分类，自动维护已引用的个人文库条目                 |
| 显示引用标记     | 在“引用”列查看文献在文档中的引用文本，例如 `[1]`、`[1, 2]` 或作者—年份引用 |
| 快捷键引用       | 在 Zotero 中选中文献，按英文单引号键 `'`，插入到 Word 当前引用位置         |
| 阅读时引用       | 在 Zotero 阅读器标签页中按 `'`，引用当前附件所属的父条目                   |
| 拖拽引用         | 将一篇或多篇文献从条目列表拖到 Word，直接插入引用                          |
| 沿用原生引用流程 | 由 Zotero 完成引用样式处理、相邻引用合并及文档更新，而不是粘贴静态文本     |

## 安装与开始使用

1. 从 [Releases](https://github.com/MuiseDestiny/zotero-citation/releases) 下载 `zotero-citation.xpi`。
2. 打开 Zotero 的插件管理器，在齿轮菜单中选择“从文件安装插件”，选择下载的 XPI。
3. 确保 Word 中的 Zotero 加载项可以正常使用原生 **Add/Edit Citation** 和 **Refresh**。
4. 打开 Word 文档，插入一条 Zotero 引用，或对已有引用的文档执行一次 **Refresh**。
5. 回到 Zotero，查看左侧生成的 Word 临时分类；在条目列表的列标题菜单中显示“引用”列。

插件清单声明支持 **Zotero 7–11**，Word 集成功能面向 **Windows 和 macOS 的桌面版 Microsoft Word**。不适用于 Word 网页版、WPS 或 LibreOffice；不同 Zotero/Word 版本仍需实际验证兼容性。

> 插件依赖 Zotero 自带的 Word 集成，不替代 Word 加载项。首次使用 macOS 文档名称识别时，如系统请求允许 Zotero 控制 Microsoft Word，请按需授权。

## 使用说明

### 按 Word 文档查看已引用文献

当 Zotero 建立 Word 引用会话后，插件会在“我的文库”下创建带有 Word 图标的临时分类，并根据会话中的引用记录增减条目。

-   同时编辑多个文档时，各引用会话分别对应自己的分类。
-   能匹配到文档元数据时，分类自动使用 Word 文档名称；暂时无法识别时，使用 `Word (1)` 等名称。
-   文档改名或另存为后，插件会在后续名称检查中尝试更新分类名称；手动改过的分类名称会被保留。
-   分类收录的是原有条目，不会再复制一份文献。当前只收录属于个人文库的条目，不将群组库条目加入该分类。

**这些分类是临时视图，不是永久保存的文献清单。** 插件在引用会话移除、插件关闭或 Zotero 窗口关闭时清理对应分类；异常退出遗留的、由插件记录归属的分类会在下次启动时尝试清理。清理分类不等于删除其中的文献条目。

需要长期保留文献清单时，请将条目加入自己创建的普通分类，不要仅依赖临时分类或给临时分类改名。

<details>
<summary>查看引用归类演示</summary>

![引用归类与引用列](https://user-images.githubusercontent.com/51939531/218295007-d603f9b8-3147-4cd6-9e7e-c75351889d84.png)

</details>

### 查看“引用”列

在 Zotero 条目列表的列标题菜单中启用“引用”列，即可查看条目在对应 Word 引用会话中的引用标记。

-   选中插件生成的临时分类时，优先显示该分类对应文档的信息。
-   在其他位置，使用 Zotero 当前引用会话的信息；没有可用会话或条目未被引用时留空。
-   文内引用显示会话提供的引用文本；同一条目在多处被引用时，会汇总这些记录。
-   注释型样式当前显示文献首次出现顺序对应的编号，不应将其视为 Word 中每处脚注的实际编号。

“引用”列反映的是 Zotero 最近一次处理文档后掌握的状态。直接在 Word 中删除或调整引用后，可执行 **Refresh**，再回到 Zotero 查看。

### 按 `'` 快捷引用

1. 在 Word 中将光标放到需要插入引用的位置。
2. 切换到 Zotero，选中一篇或多篇文献。
3. 按英文单引号键 `'`，将所选条目提交给 Word 的 Zotero 引用流程。

在 Zotero 阅读器标签页中，也可以按 `'` 引用当前附件的父条目。没有父条目的独立 PDF 不会产生空引用。在搜索框等输入区域输入单引号时，不触发快捷引用。

<details>
<summary>查看快捷键引用演示</summary>

![快捷键引用](https://user-images.githubusercontent.com/44738481/215477177-c0a58567-a5e4-410c-a8d4-c1207fab02b0.gif)

</details>

### 拖拽引用

显示“引用”列后，从条目列表的标题、作者、引用等任意列，将一篇或多篇普通文献条目拖到 Word 中需要插入引用的位置。

-   **显示“引用”列即启用拖拽引用，隐藏该列即关闭。** 快捷键引用不受此开关影响。
-   拖入 Zotero 自身的分类时，保留条目归类行为，不向 Word 插入引用。
-   拖出附件、笔记或混合类型的选择时，使用 Zotero 原生拖拽流程。
-   取消拖拽或松手位置不属于 Word 时，不提交快捷引用。

例如，在适合合并的位置为 `[1]` 再加入一篇文献时，可以由 Zotero 合并为 `[1, 2]`，而不是简单拼接成 `[1][2]`。实际结果取决于光标位置、现有引用和所用样式。

<details>
<summary>查看拖拽引用演示</summary>

![拖拽引用](https://user-images.githubusercontent.com/51939531/220587000-ce2842cd-8ec5-4f8a-92f3-f78662abb6be.gif)

</details>

> 以上演示来自较早版本，具体界面以当前 Zotero 和插件为准。

## 实现原理

插件主要连接三部分：**Zotero 引用会话、条目列表 UI、Word 原生集成流程**。它不通过直接解压或扫描 `.docx` 来获取完整引用列表，也不自行实现 Word 引用域的写入。

### 1. 从引用会话同步临时分类

[`src/modules/citation.ts`](src/modules/citation.ts) 每秒检查 Zotero 的 `Integration.sessions`，筛选 Word 会话；Zotero 正在处理文档时暂不更新，避免读取处理中间状态。

-   从 `citationsByItemID` 获取文献与引用记录的对应关系。
-   从 `citationsByIndex` 获取文献首次出现的顺序。
-   为各会话创建普通 Zotero 分类，对比条目 ID 集合，在数据库事务中增量添加或移除成员。
-   缓存引用列数据，并通过 Zotero 通知机制触发条目重绘。

临时分类的 key 记录在本机偏好设置中，用于后续清理；也兼容清理旧版本带有专属关系标记的分类。插件不会仅凭名称删除用户分类，也不会自动删除无法确认归属的旧保存搜索。

### 2. 用文档元数据匹配名称

[`src/modules/wordDocuments.ts`](src/modules/wordDocuments.ts) 约每 5 秒尝试读取已打开 Word 文档的名称和 Zotero 自定义属性：

-   **Windows：** 通过 PowerShell 调用 Word COM 接口。
-   **macOS：** 通过 AppleScript 查询 Microsoft Word。

插件拼接连续的 `ZOTERO_PREF_1`、`ZOTERO_PREF_2` 等属性，再交给 Zotero 自身的 `DocumentData` 解析，以 `sessionID` 匹配引用会话与文档名称，而不是猜测前台窗口标题。

如果多个文档带有相同的会话 ID，插件不会贸然采用其中一个文档的名称。名称读取失败不阻止基于已有会话的引用分类同步。

### 3. 把所选条目交给 Zotero 原生引用流程

[`src/modules/cite.ts`](src/modules/cite.ts) 先将选中附件转换为父条目、过滤无效条目并去重，然后调用 Zotero 原生 `addEditCitation` 命令。

由于 Zotero 目前没有公开的 `insertCitation(items)` 接口，插件临时监听引用窗口的创建，在确认属于本次命令后，隐藏该窗口，将条目 ID 加入原生 `CitationEditInterface` 并调用 `accept()`。首次设置文档样式等必要的原生对话框仍由 Zotero 处理。

之后的引用域读取、相邻引用合并、格式生成和文档更新都由 Zotero 完成。插件不替换 `Session.cite()` 或 `execCommand()`，也不维护另一套引用格式化逻辑；操作结束后会移除临时窗口监听器。

### 4. 在条目列表接入引用列与拖拽

[`src/modules/views.ts`](src/modules/views.ts) 通过 `ItemTreeManager` 注册“引用”列，并在 DOM 事件层捕获普通文献条目的拖拽。

拖拽数据保留 Zotero 内部归类所需的 `zotero/item` 类型；外部松手后，结合取消状态和操作系统提供的指针位置窗口信息，判断是否应向 Word 提交引用。目标判断见 [`src/modules/wordTarget.ts`](src/modules/wordTarget.ts)。

插件不替换 Zotero 的 Quick Copy 或条目树 `onDragStart` 方法。临时分类的 Word 图标通过可撤销的方法包装实现；关闭插件时会移除事件监听、注销列并恢复图标。

> 这些功能仍依赖 Zotero 内部的会话数据和引用窗口约定，并非全部建立在稳定的公开 API 上。Zotero 或 Word 集成升级后，可能需要相应适配。更详细的接口约定与验证范围见 [Citation integration](docs/citation-integration.md)。

## 常见问题

### 为什么打开 Word 后没有出现分类？

仅打开文档不一定会在 Zotero 中建立引用会话。请在 Word 中插入一条 Zotero 引用，或对已有引用执行 **Refresh**，等待 Zotero 完成处理后再查看。

### 为什么分类没有使用文档名称？

名称匹配依赖 Word 自定义属性和系统自动化接口。请先执行一次 Word 的 Zotero 操作，稍等后再查看；macOS 上还需检查系统的自动化权限。文档元数据缺失、会话 ID 重复或 Word 忙于对话框时，可能暂时显示 `Word (n)`。也可以手动命名，但分类仍然是临时的。

### 关闭 Word 后，分类为什么还在？

分类生命周期跟随 Zotero 保存的引用会话，不直接跟随 Word 窗口。关闭文档后，Zotero 可能仍保留该会话，因此分类不一定立即消失；关闭插件或 Zotero 时会尝试清理。

### 拖拽后为什么没有插入引用？

先确认“引用”列已显示，拖动的是普通文献条目，并且松手位置在 Word 窗口内。再检查 Word 原生 **Add/Edit Citation** 是否可用，以及是否有尚未结束的 Zotero 文档操作或等待处理的对话框。

### Word 提示整合错误怎么办？

先排查原生 Zotero Word 集成：确保 Word 加载项与当前 Zotero 安装匹配，必要时从 Zotero 的引用设置中重新安装 Word 加载项。本插件不能绕过原生集成故障。

## 开发与验证

项目使用 TypeScript 和 esbuild。安装依赖后，可执行：

```bash
npm ci
npm test
npm run tsc

# 仅构建本地安装包，不改写更新清单
npm run build-prod -- --no-update
```

本地安装包位于 `build/zotero-citation.xpi`。

另有隔离 Zotero 环境中的运行时测试：

```bash
npm run test:runtime
```

运行时测试默认使用 macOS 的 `/Applications/Zotero.app/Contents/MacOS/zotero`，可通过 `ZOTERO_BIN` 指定其他路径。它创建临时配置与数据目录，验证真实 Zotero 条目树、拖拽事件和原生引用对话框接口；文档后端使用测试替身，**不等同于验证真实 Word 写入**。真实跨应用鼠标拖拽和 Windows COM 文档查询仍需平台实测。

## 反馈与致谢

-   问题与建议请提交至 [Issues](https://github.com/MuiseDestiny/zotero-citation/issues)，附上操作系统、Zotero/Word/插件版本、复现步骤及相关错误信息。
-   感谢 [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template)、[Zotero Addon Template](https://github.com/MuiseDestiny/zotero-addon-template) 及相关开源项目。
-   特别感谢 `@鑫鑫胖胖` 和 `@小明同学classic` 提供 Mac 设备协助远程调试。
-   如果插件对你有帮助，欢迎 Star，或通过[赞助入口](https://github.com/MuiseDestiny/zotero-reference#%E8%B5%9E%E5%8A%A9)支持开发。

## 许可证

[AGPL-3.0-or-later](LICENSE)
