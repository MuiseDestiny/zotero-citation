# Issue audit — 2026-10-17

本次核查 GitHub 仓库全部 **77 个未关闭 Issue** 的正文和讨论，对照当前代码与测试。关闭仅针对下表中证据明确的条目；不将旧版本、信息不足、第三方组合或功能请求统一视为已修复。

## 本次源码修复

-   引用列：更新数据时先清除各窗口条目行缓存，再发送重绘通知；Word 会话切换也触发重绘。没有当前会话但只有一个 Word 会话时安全回退，多会话不猜测文档（#191、#192）。
-   嵌入引用：协作者文档可包含 `sessionID/key` 形式的非本地 ID；过滤后不再将其传给 `Items.get()`，防止整次同步中断。**不自动导入协作者嵌入文献，也不实现群组库分类**（涉及 #171、#126、#139，保留这些请求）。
-   拖拽开关：读取 `extensions.zotero.zoterocitation.dragCite.enable`，设为 `false` 可保留引用列并关闭拖拽引用，快捷键不受影响；四语 README 已补充（#130）。

## 验证与限制

-   26 项自动化测试通过，包含启动、缓存失效、会话切换、嵌入 ID、拖拽偏好与既有拖拽回归。
-   TypeScript 与变更模块 ESLint 检查通过。
-   Zotero `11.0-beta.1+b551fb670` 隔离运行时测试通过：真实条目树缓存从空引用更新为 `[7]`，以及原生引用 IO 和拖拽契约。
-   文档后端仍为测试替身；未验证真实 Word 写入、真实跨应用鼠标释放、Windows COM 或所有第三方插件组合。
-   **本次源码修复随 [0.5.11](https://github.com/MuiseDestiny/zotero-citation/releases/tag/0.5.11) 发布，0.5.10 不包含这些新修复。** 核查提交后，经用户另行授权发布插件并更新自动更新清单。
-   旧保存搜索缺少可靠归属标记，不自动删除，避免误删用户数据。

## 逐项结论

| Issue                                                              | 分类                        | 处理           | 依据／剩余工作                                                                                        |
| ------------------------------------------------------------------ | --------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| [#192](https://github.com/MuiseDestiny/zotero-citation/issues/192) | 本次源码修复                | 附验证结果关闭 | 与 #191 相同的引用列缓存问题；真实 Zotero 11 beta 回归通过，未声称实测 Zotero 9/10。                  |
| [#191](https://github.com/MuiseDestiny/zotero-citation/issues/191) | 本次源码修复                | 附验证结果关闭 | 修复行缓存未失效导致普通分类引用列仍空白；增加唯一会话回退和会话切换重绘，真实 Zotero 缓存回归通过。  |
| [#189](https://github.com/MuiseDestiny/zotero-citation/issues/189) | 已有修复／已解决            | 解释后关闭     | 生产包已移除旧工具箱控制台加载路径；启动测试在旧 ChromeUtils.import 抛错时仍能通过。                  |
| [#187](https://github.com/MuiseDestiny/zotero-citation/issues/187) | 需环境复核／未确认解决      | 保留           | 旧保存搜索已改为普通分类；仍需真实文档复核。新修复过滤嵌入 ID，避免一个无效 ID 中断整次同步。         |
| [#186](https://github.com/MuiseDestiny/zotero-citation/issues/186) | 需环境复核／未确认解决      | 保留           | 旧版无归属标记的保存搜索无法安全自动删除；可手动删除确认无用的旧搜索。当前只清理确认归属的临时分类。  |
| [#185](https://github.com/MuiseDestiny/zotero-citation/issues/185) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#184](https://github.com/MuiseDestiny/zotero-citation/issues/184) | 需环境复核／未确认解决      | 保留           | 清单已支持 Zotero 9，但评论同时报告快捷引用失败，不能按安装成功整体关闭。                             |
| [#183](https://github.com/MuiseDestiny/zotero-citation/issues/183) | 已有修复／已解决            | 解释后关闭     | 仅捕获普通文献条目的拖拽；PDF、笔记与混合选择走原生处理，已有回归测试。                               |
| [#182](https://github.com/MuiseDestiny/zotero-citation/issues/182) | 需环境复核／未确认解决      | 保留           | 当前按本地条目 ID 维护普通分类；需原始文档复核计数，不能仅凭代码认定全部修复。                        |
| [#181](https://github.com/MuiseDestiny/zotero-citation/issues/181) | 未实现的功能／支持范围请求  | 保留           | 属于功能请求，不作为 bug 修复后关闭。群组库、嵌入文献导入、LibreOffice 等尚未实现。                   |
| [#180](https://github.com/MuiseDestiny/zotero-citation/issues/180) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#179](https://github.com/MuiseDestiny/zotero-citation/issues/179) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#178](https://github.com/MuiseDestiny/zotero-citation/issues/178) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#176](https://github.com/MuiseDestiny/zotero-citation/issues/176) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#174](https://github.com/MuiseDestiny/zotero-citation/issues/174) | 需环境复核／未确认解决      | 保留           | 报告含 WPS 和快捷键焦点问题；当前仅支持 Word，需在 Zotero 非输入区复测。                              |
| [#173](https://github.com/MuiseDestiny/zotero-citation/issues/173) | 已有修复／已解决            | 解释后关闭     | 保留 zotero/item 数据，内部 drop 清除待引用状态；已有回归测试。                                       |
| [#172](https://github.com/MuiseDestiny/zotero-citation/issues/172) | 需环境复核／未确认解决      | 保留           | 已改用原生当前文档入口并过滤空/嵌入 ID，但需 Windows Word 真机验证。                                  |
| [#171](https://github.com/MuiseDestiny/zotero-citation/issues/171) | 未实现的功能／支持范围请求  | 保留           | 属于功能请求，不作为 bug 修复后关闭。群组库、嵌入文献导入、LibreOffice 等尚未实现。                   |
| [#170](https://github.com/MuiseDestiny/zotero-citation/issues/170) | 需环境复核／未确认解决      | 保留           | DOM 层拦截避免旧处理器覆盖，但未实测当前 Jasminum 的插件组合。                                        |
| [#168](https://github.com/MuiseDestiny/zotero-citation/issues/168) | 需环境复核／未确认解决      | 保留           | Windows 权限/进程环境需平台验证；不建议默认管理员运行。                                               |
| [#167](https://github.com/MuiseDestiny/zotero-citation/issues/167) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#164](https://github.com/MuiseDestiny/zotero-citation/issues/164) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#163](https://github.com/MuiseDestiny/zotero-citation/issues/163) | 需环境复核／未确认解决      | 保留           | 当前每会话独立增量同步；需原文档验证混杂来源。                                                        |
| [#161](https://github.com/MuiseDestiny/zotero-citation/issues/161) | 已有修复／已解决            | 解释后关闭     | 阅读器快捷引用已实现；讨论中提问者已确认恢复，父条目归一化有测试。                                    |
| [#160](https://github.com/MuiseDestiny/zotero-citation/issues/160) | 已有修复／已解决            | 解释后关闭     | 当前清单上限为 11.\*，涵盖报告中的 Zotero 7.1；原上限问题已消除。                                     |
| [#159](https://github.com/MuiseDestiny/zotero-citation/issues/159) | 未实现的功能／支持范围请求  | 保留           | 属于功能请求，不作为 bug 修复后关闭。群组库、嵌入文献导入、LibreOffice 等尚未实现。                   |
| [#158](https://github.com/MuiseDestiny/zotero-citation/issues/158) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#153](https://github.com/MuiseDestiny/zotero-citation/issues/153) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#152](https://github.com/MuiseDestiny/zotero-citation/issues/152) | 已有修复／已解决            | 解释后关闭     | 仅在 Word 文档目标松手时引用；取消、内部 drop、非 Word 和隐藏列均不触发，已有测试。                   |
| [#150](https://github.com/MuiseDestiny/zotero-citation/issues/150) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#148](https://github.com/MuiseDestiny/zotero-citation/issues/148) | 需环境复核／未确认解决      | 保留           | 旧工具箱路径已移除，但未逐一实测报告涉及的插件组合。                                                  |
| [#147](https://github.com/MuiseDestiny/zotero-citation/issues/147) | 未实现的功能／支持范围请求  | 保留           | 属于功能请求，不作为 bug 修复后关闭。群组库、嵌入文献导入、LibreOffice 等尚未实现。                   |
| [#144](https://github.com/MuiseDestiny/zotero-citation/issues/144) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#142](https://github.com/MuiseDestiny/zotero-citation/issues/142) | 需环境复核／未确认解决      | 保留           | 旧版无归属标记的保存搜索仍需人工清理，不能误删用户搜索。                                              |
| [#141](https://github.com/MuiseDestiny/zotero-citation/issues/141) | 已有修复／已解决            | 解释后关闭     | 隐藏引用列时不拦截原生拖拽，已有回归测试。                                                            |
| [#140](https://github.com/MuiseDestiny/zotero-citation/issues/140) | 需环境复核／未确认解决      | 保留           | 名称识别和清理已重构；缺失条目可能涉及嵌入/群组来源，仍需文档复核。                                   |
| [#139](https://github.com/MuiseDestiny/zotero-citation/issues/139) | 未实现的功能／支持范围请求  | 保留           | 属于功能请求，不作为 bug 修复后关闭。群组库、嵌入文献导入、LibreOffice 等尚未实现。                   |
| [#138](https://github.com/MuiseDestiny/zotero-citation/issues/138) | 需环境复核／未确认解决      | 保留           | 元数据命名已实现，需核对原环境和 Word 自动化权限。                                                    |
| [#137](https://github.com/MuiseDestiny/zotero-citation/issues/137) | 未实现的功能／支持范围请求  | 保留           | 属于功能请求，不作为 bug 修复后关闭。群组库、嵌入文献导入、LibreOffice 等尚未实现。                   |
| [#136](https://github.com/MuiseDestiny/zotero-citation/issues/136) | 使用问题／历史交互请求      | 保留           | 需区别原生样式、编辑引用与旧命令面板行为，不作为本次已修复 bug。                                      |
| [#135](https://github.com/MuiseDestiny/zotero-citation/issues/135) | 旧版 Zotero 6／版本支持问题 | 保留           | 当前支持 Zotero 7–11；未修改旧版分支，不能宣称已修复 Zotero 6。                                       |
| [#134](https://github.com/MuiseDestiny/zotero-citation/issues/134) | 使用问题／历史交互请求      | 保留           | 需区别原生样式、编辑引用与旧命令面板行为，不作为本次已修复 bug。                                      |
| [#133](https://github.com/MuiseDestiny/zotero-citation/issues/133) | 使用问题／历史交互请求      | 保留           | 需区别原生样式、编辑引用与旧命令面板行为，不作为本次已修复 bug。                                      |
| [#132](https://github.com/MuiseDestiny/zotero-citation/issues/132) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#131](https://github.com/MuiseDestiny/zotero-citation/issues/131) | 旧版 Zotero 6／版本支持问题 | 保留           | 当前支持 Zotero 7–11；未修改旧版分支，不能宣称已修复 Zotero 6。                                       |
| [#130](https://github.com/MuiseDestiny/zotero-citation/issues/130) | 本次源码修复                | 附验证结果关闭 | 启用既有 dragCite.enable 偏好设置，允许保留引用列但独立关闭拖拽引用；附件原生行为也有测试。           |
| [#129](https://github.com/MuiseDestiny/zotero-citation/issues/129) | 旧版 Zotero 6／版本支持问题 | 保留           | 当前支持 Zotero 7–11；未修改旧版分支，不能宣称已修复 Zotero 6。                                       |
| [#126](https://github.com/MuiseDestiny/zotero-citation/issues/126) | 未实现的功能／支持范围请求  | 保留           | 属于功能请求，不作为 bug 修复后关闭。群组库、嵌入文献导入、LibreOffice 等尚未实现。                   |
| [#124](https://github.com/MuiseDestiny/zotero-citation/issues/124) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#123](https://github.com/MuiseDestiny/zotero-citation/issues/123) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#122](https://github.com/MuiseDestiny/zotero-citation/issues/122) | 未实现的功能／支持范围请求  | 保留           | 属于功能请求，不作为 bug 修复后关闭。群组库、嵌入文献导入、LibreOffice 等尚未实现。                   |
| [#121](https://github.com/MuiseDestiny/zotero-citation/issues/121) | 旧版 Zotero 6／版本支持问题 | 保留           | 当前支持 Zotero 7–11；未修改旧版分支，不能宣称已修复 Zotero 6。                                       |
| [#113](https://github.com/MuiseDestiny/zotero-citation/issues/113) | 使用问题／历史交互请求      | 保留           | 需区别原生样式、编辑引用与旧命令面板行为，不作为本次已修复 bug。                                      |
| [#110](https://github.com/MuiseDestiny/zotero-citation/issues/110) | 已有修复／已解决            | 解释后关闭     | 普通引用拖拽抑制 Quick Copy 文本；真实 Zotero 拖拽测试通过。                                          |
| [#101](https://github.com/MuiseDestiny/zotero-citation/issues/101) | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#96](https://github.com/MuiseDestiny/zotero-citation/issues/96)   | 需环境复核／未确认解决      | 保留           | 拖拽文本已抑制，但报告截图所指的过渡状态仍需真实 Word 复核，不将原生域更新时间直接认定为 bug 已修复。 |
| [#93](https://github.com/MuiseDestiny/zotero-citation/issues/93)   | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#92](https://github.com/MuiseDestiny/zotero-citation/issues/92)   | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#85](https://github.com/MuiseDestiny/zotero-citation/issues/85)   | 已有修复／已解决            | 解释后关闭     | 讨论中提问者已确认修复；当前使用原生列注册，真实 Zotero 列注册测试通过。                              |
| [#83](https://github.com/MuiseDestiny/zotero-citation/issues/83)   | 旧版 Zotero 6／版本支持问题 | 保留           | 当前支持 Zotero 7–11；未修改旧版分支，不能宣称已修复 Zotero 6。                                       |
| [#82](https://github.com/MuiseDestiny/zotero-citation/issues/82)   | 已有修复／已解决            | 解释后关闭     | 附件不拦截，内部分类拖拽保留 zotero/item；已有回归测试。                                              |
| [#81](https://github.com/MuiseDestiny/zotero-citation/issues/81)   | 未实现的功能／支持范围请求  | 保留           | 属于功能请求，不作为 bug 修复后关闭。群组库、嵌入文献导入、LibreOffice 等尚未实现。                   |
| [#63](https://github.com/MuiseDestiny/zotero-citation/issues/63)   | 旧版 Zotero 6／版本支持问题 | 保留           | 当前支持 Zotero 7–11；未修改旧版分支，不能宣称已修复 Zotero 6。                                       |
| [#33](https://github.com/MuiseDestiny/zotero-citation/issues/33)   | 未实现的功能／支持范围请求  | 保留           | 属于功能请求，不作为 bug 修复后关闭。群组库、嵌入文献导入、LibreOffice 等尚未实现。                   |
| [#30](https://github.com/MuiseDestiny/zotero-citation/issues/30)   | 已有修复／已解决            | 解释后关闭     | 当前使用普通 Zotero Collection，支持原生分类导出，不再是保存搜索。                                    |
| [#27](https://github.com/MuiseDestiny/zotero-citation/issues/27)   | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#22](https://github.com/MuiseDestiny/zotero-citation/issues/22)   | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#21](https://github.com/MuiseDestiny/zotero-citation/issues/21)   | 需环境复核／未确认解决      | 保留           | 名称匹配已重构，但列表排序取决于用户所选列；报告有多个症状，不整体关闭。                              |
| [#20](https://github.com/MuiseDestiny/zotero-citation/issues/20)   | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#19](https://github.com/MuiseDestiny/zotero-citation/issues/19)   | 需环境复核／未确认解决      | 保留           | 不再全局替换引用流程，但尚未实际运行 Better BibTeX CAYW 联合测试。                                    |
| [#17](https://github.com/MuiseDestiny/zotero-citation/issues/17)   | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#16](https://github.com/MuiseDestiny/zotero-citation/issues/16)   | 需环境复核／未确认解决      | 保留           | 报告主要是整合错误或快捷引用失败；缺少当前版日志，且未做 Windows/Word 真机写入，不据此认定已修复。    |
| [#15](https://github.com/MuiseDestiny/zotero-citation/issues/15)   | 已有修复／已解决            | 解释后关闭     | 讨论中作者说明属 Style 问题，提问者确认显示正常；不需修改 Citation。                                  |
| [#7](https://github.com/MuiseDestiny/zotero-citation/issues/7)     | 需环境复核／未确认解决      | 保留           | 不再替换 Session.cite，普通对话框由 Zotero 控制；真实 Word Add/Edit 操作仍需验证。                    |
| [#4](https://github.com/MuiseDestiny/zotero-citation/issues/4)     | 使用问题／历史交互请求      | 保留           | 需区别原生样式、编辑引用与旧命令面板行为，不作为本次已修复 bug。                                      |
| [#2](https://github.com/MuiseDestiny/zotero-citation/issues/2)     | 需环境复核／未确认解决      | 保留           | 原生列注册已重构；未实测当前 Style 组合，旧命令面板也非当前功能。                                     |
| [#1](https://github.com/MuiseDestiny/zotero-citation/issues/1)     | 未实现的功能／支持范围请求  | 保留           | 属于功能请求，不作为 bug 修复后关闭。群组库、嵌入文献导入、LibreOffice 等尚未实现。                   |

本次关闭 **15** 项，保留 **62** 项。关闭本次修复的 Issue 时已说明当时尚未发布；修复随后纳入 0.5.11，并在对应 Issue 补充发布通知。
