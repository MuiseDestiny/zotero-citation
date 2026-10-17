# Zotero Citation · Easier Citation

<img src="addon/chrome/content/icons/favicon.png" alt="Zotero Citation" width="64">

**English** | [简体中文](README.zh-CN.md) | [Русский](README.ru.md) | [Français](README.fr.md)

[![Latest release](https://img.shields.io/github/v/release/MuiseDestiny/zotero-citation)](https://github.com/MuiseDestiny/zotero-citation/releases)
[![Downloads](https://img.shields.io/github/downloads/MuiseDestiny/zotero-citation/total?color=yellow)](https://github.com/MuiseDestiny/zotero-citation/releases)
[![License](https://img.shields.io/github/license/MuiseDestiny/zotero-citation)](LICENSE)

See which items your Word document cites, and insert citations directly from Zotero with a keystroke or drag-and-drop.

## Features

| Feature              | What it does                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| Document collections | Maintains a temporary collection of cited personal-library items for each Word citation session           |
| Citation column      | Shows citation text such as `[1]`, `[1, 2]`, or author–date citations                                     |
| Keyboard shortcut    | Inserts selected items into Word when you press the apostrophe key `'` in Zotero                          |
| Cite while reading   | Cites the parent item of the attachment open in a Zotero reader tab                                       |
| Drag-and-drop        | Inserts one or more items dragged from the item list into Word                                            |
| Native integration   | Lets Zotero handle styles, adjacent-citation merging, and document updates instead of pasting static text |

## Installation and Quick Start

1. Download `zotero-citation.xpi` from [Releases](https://github.com/MuiseDestiny/zotero-citation/releases).
2. Open Zotero’s plugin manager, choose **Install Add-on From File** from the gear menu, and select the XPI.
3. Check that Zotero’s native **Add/Edit Citation** and **Refresh** commands work in Word.
4. Insert a Zotero citation in Word, or click **Refresh** in a document that already contains citations.
5. Return to Zotero to find the temporary Word collection. Enable **Citation** from the item-list column header menu.

The manifest declares support for **Zotero 7–11**. Word integration targets **desktop Microsoft Word on Windows and macOS**, not Word for the web, WPS, or LibreOffice. Individual Zotero/Word versions still require compatibility testing.

> The plugin depends on Zotero’s Word integration and does not replace the Word add-in. On macOS, document-name detection may ask you to allow Zotero to control Microsoft Word.

## Usage

### Browse Cited Items by Document

Once Zotero establishes a Word citation session, the plugin creates a temporary collection with a Word icon under **My Library** and updates its membership from citation records.

-   Each session gets its own collection when multiple documents are in use.
-   Metadata matching supplies the document name; otherwise a fallback such as `Word (1)` is used.
-   Later checks attempt to follow renames and Save As operations. Manually edited collection names are preserved.
-   Collections reference existing items, not duplicate copies. Only personal-library items are added, not group-library items.

**These are temporary views, not permanent reading lists.** Cleanup runs when a session is removed, the plugin shuts down, or the Zotero window closes. Startup also attempts to clean up owned collections left by interrupted shutdowns. Removing collections does not delete their library items.

For a permanent list, add items to your own regular collection. Renaming a temporary collection does not make it permanent.

<details>
<summary>Collection demo</summary>

![Document collection and citation column](https://user-images.githubusercontent.com/51939531/218295007-d603f9b8-3147-4cd6-9e7e-c75351889d84.png)

</details>

### Use the Citation Column

Enable **Citation** from the item-list column header menu. A plugin-created collection takes priority when selecting the document to display; elsewhere, the column uses Zotero’s current citation session. Without a relevant session or citation, it stays empty.

In-text styles show citation text supplied by the session, listing multiple occurrences together. **Note styles currently show first-appearance order, not the actual footnote number of each occurrence in Word.**

The column reflects the last document state processed by Zotero. After deleting or rearranging citations directly in Word, click **Refresh** before checking Zotero again.

### Press `'` to Cite

1. Place the cursor at the insertion point in Word.
2. Switch to Zotero and select one or more items.
3. Press the apostrophe key `'` to submit the items to the native citation workflow.

In a Zotero reader tab, the shortcut cites the current attachment’s parent. A standalone PDF without a parent does not create an empty citation. Typing an apostrophe in a search box or another input field does not trigger the shortcut.

<details>
<summary>Keyboard shortcut demo</summary>

![Keyboard citation](https://user-images.githubusercontent.com/44738481/215477177-c0a58567-a5e4-410c-a8d4-c1207fab02b0.gif)

</details>

### Drag Items into Word

With **Citation** visible, drag regular items from any item-list column, including Title, Creator, or Citation, to the insertion point in Word.

-   **Show Citation to enable drag-to-cite; hide it to disable it.** The keyboard shortcut is unaffected.
-   Internal Zotero collection drops retain item organization behavior and do not insert a Word citation.
-   Attachment, note, and mixed-type drags use Zotero’s native workflow.
-   Cancelling a drag or releasing outside Word does not submit a quick citation.

At a suitable position next to `[1]`, Zotero can merge another item into `[1, 2]` instead of appending `[1][2]`. Results depend on the cursor position, existing citations, and style.

<details>
<summary>Drag-and-drop demo</summary>

![Drag-to-cite](https://user-images.githubusercontent.com/51939531/220587000-ce2842cd-8ec5-4f8a-92f3-f78662abb6be.gif)

</details>

> Demos come from earlier versions; the current interface may differ.

## How It Works

The plugin connects **Zotero citation sessions, the item-list UI, and native Word integration**. It does not unpack or scan `.docx` files to extract the full citation list, or implement Word field writing itself.

### 1. Synchronize Collections from Sessions

[`src/modules/citation.ts`](src/modules/citation.ts) checks `Integration.sessions` every second for Word sessions, skipping updates while Zotero processes a document.

-   `citationsByItemID` supplies item-to-citation records; `citationsByIndex` supplies first-appearance order.
-   Item ID sets are compared and collection membership is updated incrementally in a database transaction.
-   Citation-column data is cached; Zotero notifications trigger item redraws.

Owned collection keys are stored in a local preference for cleanup. Older dedicated relation markers are also recognized. Collections are never deleted based only on names, and old saved searches without provable ownership are not automatically removed.

### 2. Match Names through Document Metadata

[`src/modules/wordDocuments.ts`](src/modules/wordDocuments.ts) attempts to read open document names and Zotero custom properties about every five seconds: **PowerShell/COM on Windows**, **AppleScript on macOS**.

Consecutive `ZOTERO_PREF_1`, `ZOTERO_PREF_2`, etc. properties are concatenated and parsed by Zotero’s `DocumentData`. The resulting `sessionID` links the name to its session, rather than guessing from a foreground window title. Duplicate session IDs are excluded from name matching. Failed name queries do not prevent synchronization from existing sessions.

### 3. Submit Items through the Native Workflow

[`src/modules/cite.ts`](src/modules/cite.ts) resolves attachments to parents, filters invalid items, removes duplicates, and invokes native `addEditCitation`.

Zotero currently has no public `insertCitation(items)` API. The plugin temporarily watches for citation windows, identifies the window belonging to this command, hides it, adds item IDs to the native `CitationEditInterface`, and calls `accept()`. Required dialogs, such as initial document-style setup, remain under Zotero’s control.

Zotero handles field loading, merging, formatting, and writes. The plugin does not replace `Session.cite()` or `execCommand()`, or maintain a separate formatter. Temporary window observers are removed afterward.

### 4. Integrate the Column and Drag Events

[`src/modules/views.ts`](src/modules/views.ts) registers the column through `ItemTreeManager` and captures regular-item drags at the DOM event layer. Drag data retains `zotero/item` for internal collection drops. For external drops, cancellation state and operating-system window information at the pointer determine whether to cite; see [`src/modules/wordTarget.ts`](src/modules/wordTarget.ts).

Quick Copy and the item tree’s `onDragStart` are not replaced. A reversible method wrapper renders Word collection icons. Shutdown removes listeners, unregisters the column, and restores icons.

> Internal session data and citation-window contracts are not stable public APIs. Zotero or Word integration upgrades may require adaptations. See [Citation integration](docs/citation-integration.md) for contracts and validation scope.

## Troubleshooting

-   **No collection?** Opening Word alone may not establish a session. Insert a citation or click **Refresh**, then wait for processing to finish.
-   **No document name?** Run a Zotero command in Word and wait. Check macOS automation permissions. Missing metadata, duplicate session IDs, or a busy Word dialog can leave `Word (n)`. Manual renaming does not make the collection permanent.
-   **Collection remains after closing Word?** Zotero may retain sessions after documents close. Collections follow sessions, not window lifetimes; plugin or Zotero shutdown attempts cleanup.
-   **Drag does not insert?** Show Citation, drag regular items, release inside Word, and check native **Add/Edit Citation**. Finish pending document operations or dialogs first.
-   **Integration error?** Ensure the Word add-in matches Zotero; reinstall from Zotero’s citation settings if necessary. The plugin cannot bypass broken native integration.

## Development and Validation

The project uses TypeScript and esbuild:

```bash
npm ci
npm test
npm run tsc

# Build locally without rewriting the update manifest
npm run build-prod -- --no-update
```

Output: `build/zotero-citation.xpi`. An isolated runtime test is also available:

```bash
npm run test:runtime
```

The default executable is `/Applications/Zotero.app/Contents/MacOS/zotero`; override with `ZOTERO_BIN`. Temporary profile/data directories isolate the test. It exercises the real item tree, drag events, and citation dialogs, but uses a fixture document backend: **it does not verify real Word writes**. Actual cross-application mouse drops and Windows COM queries still need platform testing.

## Feedback and Acknowledgments

-   Report [issues](https://github.com/MuiseDestiny/zotero-citation/issues) with OS, Zotero/Word/plugin versions, reproduction steps, and errors.
-   Thanks to [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template), [Zotero Addon Template](https://github.com/MuiseDestiny/zotero-addon-template), and related open-source projects.
-   Special thanks to `@鑫鑫胖胖` and `@小明同学classic` for providing Macs for remote debugging.
-   Consider starring the repository or [supporting development](https://github.com/MuiseDestiny/zotero-reference#%E8%B5%9E%E5%8A%A9).

## License

[AGPL-3.0-or-later](LICENSE)
