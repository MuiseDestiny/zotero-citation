# Zotero Ciation

![Reference](addon/chrome/content/icons/favicon.png)

[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-round&logo=github)](https://github.com/windingwind/zotero-plugin-template)
[![Latest release](https://img.shields.io/github/v/release/MuiseDestiny/zotero-citation)](https://github.com/MuiseDestiny/zotero-citation/releases)
![Release Date](https://img.shields.io/github/release-date/MuiseDestiny/zotero-citation?color=9cf)
[![License](https://img.shields.io/github/license/MuiseDestiny/zotero-citation)](https://github.com/MuiseDestiny/zotero-citation/blob/master/LICENSE)
![Downloads latest release](https://img.shields.io/github/downloads/MuiseDestiny/zotero-citation/latest/total?color=yellow)


🎈 插件对 Windows 全功能支持，对 Mac 支持较差。

🪐 你需要在 Word 里点一次刷新，插件在 Zotero 生成的文件夹才能被重命名为你打开的 Word 的文件名。

⌛ 插件生成的文件夹生命周期为在 Word 里插入第一条引用开始，到关闭Zotero结束，每次打开 Word 都会重新生成这个文件夹。 

🎉 使用插件提供的引用，相邻引用自动合并，如在 [1] 后面插入新的文献，会变成 [1, 2]，而非 [1][2] 。

⭐ 这是一个完全基于用户角度需求开发的插件，觉得好用，欢迎Satr。

👋 由于开发者没有 Mac 设备，适配不到的功能见谅；如你是 Mac 开发者，欢迎继续开发插件在 Mac 上未能实现的功能。

---

## 功能

### 1. 引用归类

> 将 Word 中的引文整理到 Zotero，并创建引用列

<details>
<summary>演示</summary>

![image](https://user-images.githubusercontent.com/51939531/218295007-d603f9b8-3147-4cd6-9e7e-c75351889d84.png)

</details>

当你在 Word 中插入参考文献时，自动将打开的 Word 的所有引用整理到一个文件夹下。

如果你用过 EndNote，相信你很熟悉这个功能。

这个文件夹是临时的，关闭 Zotero 后会自动删除（如果自动删除失败，下次打开时可手动删除）。

### 2. 快捷引用条目到 Word

#### 2.1 命令引用

> 选择条目，按 `Shift + P` 打开命令行工具，选择 `引用` 命令，即可将选择条目引用到 Word。

<details>
<summary>演示</summary>

![image](https://user-images.githubusercontent.com/51939531/220589584-0a0e0fc3-020e-428e-b5a8-93e2898bc67f.png)

</details>

#### 2.2 快捷键引用

> 在 Word 中将光标定位到待插入引用的位置，在 Zotero 中选择条目后按键盘上的 `'` 键。

<details>
<summary>演示</summary>

![cite-item-by-quote-key](https://user-images.githubusercontent.com/44738481/215477177-c0a58567-a5e4-410c-a8d4-c1207fab02b0.gif)

</details>

#### 2.3 拖拽引用 

> 在 Zotero 中拖拽（鼠标按下）待引用的条目（可多选）拖拽到 Word 中需要添加引用的位置（松开鼠标）。

<details>
<summary>演示</summary>

![cite-item-by-drag](https://user-images.githubusercontent.com/51939531/220587000-ce2842cd-8ec5-4f8a-92f3-f78662abb6be.gif)

</details>

## TODO

- [x] Word 引文序号如，[1] 在 Zotero 里标注
- [ ] 适配 Mac 用户快捷引用，目前版本 Mac 用户只能使用功能 1

## 致谢

本插件基于 [模板](https://github.com/MuiseDestiny/zotero-addon-template)。
