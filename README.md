# Zotero Ciation

[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-round&logo=github)](https://github.com/windingwind/zotero-plugin-template)
[![Latest release](https://img.shields.io/github/v/release/MuiseDestiny/zotero-citation)](https://github.com/MuiseDestiny/zotero-citation/releases)
![Release Date](https://img.shields.io/github/release-date/MuiseDestiny/zotero-citation?color=9cf)
[![License](https://img.shields.io/github/license/MuiseDestiny/zotero-citation)](https://github.com/MuiseDestiny/zotero-citation/blob/master/LICENSE)
![Downloads latest release](https://img.shields.io/github/downloads/MuiseDestiny/zotero-citation/latest/total?color=yellow)

## 功能

**注意：**
- 受限于 Zotero 与 Word 的通讯机制，打开一个 Word 文档后需要刷新一次引用或插入一条参考文献后才能工作。
- Zotero提供的引用：word中光标在[1]（代表文献A）后，插入文献B，代表文献A的[1]会被替换为代表文献B的[1]；使用插件的引用，[1]会变成[1, 2]，这是和Endnote一致的。

### 1. 将 Word 中的引文整理到 Zotero

![image](https://user-images.githubusercontent.com/51939531/218295007-d603f9b8-3147-4cd6-9e7e-c75351889d84.png)

当你在 Word 中插入参考文献时，自动将打开的 Word 的所有引用整理到一个文件夹下。

如果你用过 EndNote，相信你很熟悉这个功能。

这个文件夹是临时的，关闭 Zotero 后会自动删除。

### 2. 快捷引用条目到 Word

选择条目，按 `Shift + P` 打开命令窗格，选择`引用选中`，即可将选择条目引用到 Word。

![image](https://user-images.githubusercontent.com/51939531/214848994-efb607ff-6f5a-4639-9db8-42e7bfd602fb.png)

也可以选择条目后按键盘上的 `'` 键。

![cite-item-by-quote-key](https://user-images.githubusercontent.com/44738481/215477177-c0a58567-a5e4-410c-a8d4-c1207fab02b0.gif)

## TODO

- [x] Word 引文序号如，[1]在 Zotero 里标注
- [ ] 适配 Mac 用户快捷引用，目前版本 Mac 用户只能使用功能 1

## 致谢

本插件基于 [模板](https://github.com/MuiseDestiny/zotero-addon-template)。
