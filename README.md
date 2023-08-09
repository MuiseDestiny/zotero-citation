# Ciation

![Reference](addon/chrome/content/icons/favicon.png)

[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-round&logo=github)](https://github.com/windingwind/zotero-plugin-template)
[![Latest release](https://img.shields.io/github/v/release/MuiseDestiny/zotero-citation)](https://github.com/MuiseDestiny/zotero-citation/releases)
![Release Date](https://img.shields.io/github/release-date/MuiseDestiny/zotero-citation?color=9cf)
[![License](https://img.shields.io/github/license/MuiseDestiny/zotero-citation)](https://github.com/MuiseDestiny/zotero-citation/blob/master/LICENSE)
![Downloads latest release](https://img.shields.io/github/downloads/MuiseDestiny/zotero-citation/latest/total?color=yellow)

🤝 Zotero 里的 Word 插件要和 Word 中的加载项版本保持一致，如果提示整合错误可以卸载 Word 里的加载项重装。

🎈 插件对 Windows 全功能支持，Mac不支持临时文件夹自动改名，可能需要手动更改。

🪐 你需要在 Word 里点一次刷新，插件在 Zotero 生成的文件夹才能被重命名为你打开的 Word 的文件名。

⌛ 插件生成的文件夹生命周期为：[在 Word 里插入第一条引用，关闭Zotero]；每次打开 Word 都会重新生成这个文件夹。

🎉 使用插件提供的引用，相邻引用自动合并，如在 [1] 后面插入新的文献，会变成 [1, 2]，而非 [1][2] 。

⭐ 这是一个完全基于用户角度开发的插件，觉得好用，欢迎Star。

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

#### 2.1 快捷键引用

> 在 Word 中将光标定位到待插入引用的位置，在 Zotero 中选择条目后按键盘上的 `'` 键。

<details>
<summary>演示</summary>

![cite-item-by-quote-key](https://user-images.githubusercontent.com/44738481/215477177-c0a58567-a5e4-410c-a8d4-c1207fab02b0.gif)

</details>

#### 2.2 拖拽引用

> 在 Zotero 中拖拽（鼠标按下）待引用的条目（可多选）拖拽到 Word 中需要添加引用的位置（松开鼠标）。

**需要开启引用列才可以使用，反之若想禁用拖拽引用，关闭引用列即可**

<details>
<summary>演示</summary>

![cite-item-by-drag](https://user-images.githubusercontent.com/51939531/220587000-ce2842cd-8ec5-4f8a-92f3-f78662abb6be.gif)

</details>

## TODO

-   [x] Word 引文序号如，[1] 在 Zotero 里标注
-   [x] 适配 Mac 用户快捷引用，目前版本 Mac 用户只能使用功能 1

## 致谢

-   本插件基于 [模板](https://github.com/MuiseDestiny/zotero-addon-template)。
-   在此特别感谢 `@鑫鑫胖胖` 和 `@小明同学classic` 二位同学主动联系我提供Mac设备远程调试适配 Mac

## 赞助

[这里](https://github.com/MuiseDestiny/zotero-reference#%E8%B5%9E%E5%8A%A9)
