# Citation integration

## Zotero source contracts

Checked against the installed Zotero 11.0 beta, Zotero `main`, and Zotero 7 sources:

-   [ItemTreeManager](https://github.com/zotero/zotero/blob/main/chrome/content/zotero/xpcom/itemTreeManager.js): `registerColumn()` returns the namespaced key; deprecated `registerColumns()` returns an array in current Zotero. Older releases return a single key.
-   [Item tree](https://github.com/zotero/zotero/blob/main/chrome/content/zotero/itemTree.jsx): row IDs end in `-row-N`; Zotero 11's virtual tree sets `role="treeitem"`. DOM lookup uses `.row[id]`, independent of the ARIA role. The plugin captures regular-item DOM drags before Quick Copy, retaining `zotero/item` for internal collection drops. Attachment, note and mixed drags use the native handler.
-   [Integration](https://github.com/zotero/zotero/blob/main/chrome/content/zotero/xpcom/integration.js): `Session.cite()` creates `CitationEditInterface`, opens a citation dialog, awaits `io.promise`, and performs field insertion, merging and document updates. Quick citations submit that IO through a temporary window-watcher notification. They do not replace `Session.cite`, `execCommand`, `onDragStart` or Quick Copy.
-   [Citation dialog](https://github.com/zotero/zotero/blob/main/chrome/content/zotero/integration/citationDialog.js): its load handler initializes a separate citation model and its unload handler cancels unaccepted input. A quick citation hides the native window at DOMContentLoaded, consumes the load event, and removes cancellation on unload before accepting the native IO. Document preferences and ordinary Add/Edit dialogs are left to Zotero. Hiding before chrome-load completion prevents Gecko's pending first show; macOS runtime tests inspect native NSWindow visibility after that completion, since Gecko's visibility getter always returns true.
-   [Mac application](https://github.com/zotero/zotero-word-for-mac-integration/blob/main/build/src/application.m): the integration argument identifies the Word application, not the document filename.
-   [Mac document](https://github.com/zotero/zotero-word-for-mac-integration/blob/main/build/src/document.m): Word stores Zotero data in consecutive `ZOTERO_PREF_N` custom properties. The plugin queries open document names and these properties, then parses them through Zotero's own `DocumentData` to associate a name with a session. It never infers the name from the foreground window. Renames and Save As are detected on the next metadata poll. Ambiguous duplicate session IDs are excluded; manually renamed collections are preserved.

Zotero does not currently expose a public `insertCitation(items)` API or a document-name method. Window notifications plus native citation IO avoid copying Zotero's field-writing implementation but still depend on internal dialog contracts. Only collection-icon rendering retains a reversible method wrapper.

## Validation

-   `npm test`: registration variants, native citation IO submission, observer cleanup, cancellation, selection snapshots, document/session matching and manual-name preservation.
-   `npm run tsc` and ESLint for changed modules.
-   `npm run test:runtime`: creates a fresh temporary profile/data directory, uses the original virtual-tree renderer (without test-authored ARIA attributes), dispatches a drag from a real cell, and submits two citations through the original `Session.cite()` and actual citation dialog. The field/document backend is a fixture; this verifies Zotero UI contracts, not Word writes. Set `ZOTERO_BIN` to override the installed application path. The test retains its result and log in its printed temporary directory.
-   macOS document-query AppleScript compiled against the installed Word scripting dictionary and executed read-only from Zotero Subprocess. Real document metadata parsed through Zotero DocumentData; Quartz mouse-coordinate bindings also executed in Zotero.

The manifest supports Zotero 7 through 11 (`strict_min_version: 6.999`, `strict_max_version: 11.*`). Zotero 11 drag regressions must be tested through `itemsView.tree._renderItem()`, not just the item-tree renderer, because the virtual tree assigns the final role.

Real external mouse drops into Word and Windows COM metadata queries still require platform testing. An empty-text Word drop can report `dropEffect: none`; native cancellation and the OS window at the pointer are used to decide whether to cite. macOS coordinates come from Quartz rather than Gecko's screen coordinates. Internal Zotero drops clear the pending quick citation.

Local packages use `npm run build-prod -- --no-update`. Do not publish a development package or update the public manifest without explicit release authorization.
