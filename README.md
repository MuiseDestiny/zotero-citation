# Zotero Ciation

[![Latest release](https://img.shields.io/github/v/release/MuiseDestiny/zotero-citation)](https://github.com/MuiseDestiny/zotero-citation/releases)
![Release Date](https://img.shields.io/github/release-date/MuiseDestiny/zotero-citation?color=9cf)
[![License](https://img.shields.io/github/license/MuiseDestiny/zotero-citation)](https://github.com/MuiseDestiny/zotero-citation/blob/master/LICENSE)
![Downloads latest release](https://img.shields.io/github/downloads/MuiseDestiny/zotero-citation/latest/total?color=yellow)

## 功能

### 1. 将 Word 中的引文整理到 Zotero

![image](https://user-images.githubusercontent.com/51939531/214794436-d1688d9b-652d-40ba-9af8-d397a4f26ae2.png)

当你在 Word 中插入参考文献时，自动将打开的 Word 的所有引用整理到一个文件夹下。

如果你用过 EndNote，相信你很熟悉这个功能。

这个文件夹是临时的，关闭 Zotero 后会自动删除。

**注意：**
- 受限于 Zotero 与 Word 的通讯机制，打开一个 Word 文档后需要刷新一次引用或插入一条参考文献后才能工作。
- Zotero提供的引用：word中光标在[1]（代表文献A）后，插入文献B，代表文献A的[1]会被替换为代表文献B的[1]；使用插件的引用，[1]会变成[1, 2]，这是和Endnote一致的。

### 2. 快捷引用条目到 Word

选择条目，按 `Shift + P` 打开命令窗格，选择`引用选中`，即可将选择条目引用到 Word。

![image](https://user-images.githubusercontent.com/51939531/214848994-efb607ff-6f5a-4639-9db8-42e7bfd602fb.png)

也可以选择条目后按键盘上的 `'` 键。

![cite-item-by-quote-key](https://user-images.githubusercontent.com/44738481/215477177-c0a58567-a5e4-410c-a8d4-c1207fab02b0.gif)

## TODO

- [ ] Word 引文序号如，[1]在 Zotero 里标注
- [ ] 适配 Mac 用户快捷引用，目前版本 Mac 用户只能使用功能1

## 致谢

本插件基于 [模板](https://github.com/MuiseDestiny/zotero-addon-template)。
