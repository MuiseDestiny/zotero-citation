let activeCiteItems: Promise<void> | undefined;

function getCitationItems(requestedItems?: Zotero.Item[]): Zotero.Item[] {
    let items = requestedItems;
    if (!items) {
        if (Zotero_Tabs.selectedIndex === 0) {
            items = ZoteroPane.getSelectedItems();
        } else {
            const reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);
            const attachment = reader && Zotero.Items.get(reader.itemID as number);
            items = attachment ? [attachment] : [];
        }
    }
    const parents = items
        .map((item) => (item.isRegularItem() ? item : item.parentItem))
        .filter((item): item is Zotero.Item => Boolean(item?.isRegularItem()));
    return [...new Map(parents.map((item) => [item.id, item])).values()];
}

const CITATION_DIALOGS = new Set([
    "chrome://zotero/content/integration/citationDialog.xhtml",
    "chrome://zotero/content/integration/quickFormat.xhtml",
    "chrome://zotero/content/integration/addCitationDialog.xhtml",
]);

async function runCiteItems(items: Zotero.Item[]) {
    const integration = Zotero.Integration as any;
    // Do not attach to a citation dialog belonging to an already running command.
    if (integration.currentDoc) return;
    const watcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(
        Components.interfaces.nsIWindowWatcher,
    );
    const cleanups = new Set<() => void>();
    let submitted = false;
    const observer = {
        observe(subject: any, topic: string) {
            if (topic !== "domwindowopened" || submitted) return;
            const dialog = subject;
            const getCitationIO = () => {
                if (!CITATION_DIALOGS.has(dialog.location.href)) return;
                const io = dialog.arguments?.[0]?.wrappedJSObject;
                if (io instanceof integration.CitationEditInterface && integration.currentWindow === dialog) {
                    return io;
                }
            };
            const hideDialog = () => {
                if (!getCitationIO()) return;
                // AppWindow queues its first show until chrome loading finishes.
                // Hiding at DOMContentLoaded clears that pending show; hiding only
                // at load leaves a visible empty window during document writes.
                const baseWindow = dialog.docShell.treeOwner.QueryInterface(Components.interfaces.nsIBaseWindow);
                baseWindow.visibility = false;
            };
            const onDOMContentLoaded = (event: Event) => {
                if (event.target === dialog.document) hideDialog();
            };
            const onLoad = (event: Event) => {
                if (event.target !== dialog.document || submitted) return;
                const io = getCitationIO();
                if (!io) return;
                hideDialog();
                // Consume this command's native citation IO. Field loading, merging,
                // cancellation and document writes remain Zotero's responsibility.
                event.stopImmediatePropagation();
                submitted = true;
                // The UI never initializes, so its unload handler must not cancel the
                // accepted citation when execCommand closes the window after writing.
                if (typeof dialog.onUnload === "function") {
                    dialog.removeEventListener("unload", dialog.onUnload);
                }
                dialog.document.documentElement.removeAttribute("onunload");
                dialog.onunload = null;
                for (const item of items) {
                    if (!io.citation.citationItems.some((entry: any) => String(entry.id) === String(item.id))) {
                        io.citation.citationItems.push({ id: item.id });
                    }
                }
                io.accept();
            };
            const cleanup = () => {
                dialog.removeEventListener("DOMContentLoaded", onDOMContentLoaded, true);
                dialog.removeEventListener("load", onLoad, true);
            };
            cleanups.add(cleanup);
            dialog.addEventListener("DOMContentLoaded", onDOMContentLoaded, true);
            dialog.addEventListener("load", onLoad, true);
        },
    };
    watcher.registerNotification(observer);
    try {
        await integration.execCommand(
            Zotero.isMac ? "MacWord16" : "WinWord",
            "addEditCitation",
            // Windows' getActiveDocument() delegates to getDocument(null) in some
            // integration builds. A non-path ID reaches its native active fallback.
            Zotero.isMac ? "/Applications/Microsoft Word.app/" : "__doc__",
            Zotero.isMac ? 2 : 1,
        );
    } finally {
        watcher.unregisterNotification(observer);
        for (const cleanup of cleanups) cleanup();
    }
}

export const waitForCiteItems = async (): Promise<void> => {
    await activeCiteItems?.catch(() => {});
};

export const citeItems = async (requestedItems?: Zotero.Item[]): Promise<void> => {
    if (activeCiteItems) return activeCiteItems;
    const items = getCitationItems(requestedItems);
    if (!items.length) return;
    const task = runCiteItems(items).finally(() => {
        if (activeCiteItems === task) activeCiteItems = undefined;
    });
    activeCiteItems = task;
    return task;
};
