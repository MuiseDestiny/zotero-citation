(async () => {
    const results = [];
    const check = (value, label) => {
        if (!value) throw new Error(label);
        results.push(label);
    };
    try {
        await Zotero.initializationPromise;
        await Zotero.uiReadyPromise;
        await Zotero.Schema.schemaUpdatePromise;
        await Zotero.ZoteroCitation.data.startupPromise;
        const win = Zotero.getMainWindow();
        const pane = win.ZoteroPane;
        const addon = Zotero.ZoteroCitation;
        const views = addon.data.views;
        check(typeof views.columnKey === "string", "native column registration retains its key");

        const item = new Zotero.Item("journalArticle");
        item.libraryID = Zotero.Libraries.userLibraryID;
        item.setField("title", "Citation runtime fixture");
        await item.saveTx({ skipNotifier: true });
        await pane.itemsView.waitForLoad();
        await pane.itemsView.refreshAndMaintainSelection();
        await pane.selectItem(item.id);

        const citation = addon.data.citation;
        const previousSession = Zotero.Integration.currentSession;
        const citationIndex = pane.itemsView._rowMap[item.id];
        pane.itemsView.getCellText(citationIndex, views.columnKey);
        citation.sessions.runtime = { idData: {}, pending: false, lastName: "Runtime" };
        Zotero.Integration.currentSession = { sessionID: "runtime" };
        try {
            await citation.updateCitations(
                "runtime",
                { [item.id]: [{ properties: { plainCitation: "[7]" } }] },
                [item.id],
                "in-text",
            );
            check(
                pane.itemsView.getCellText(citationIndex, views.columnKey) === "0: [7]",
                "citation updates invalidate real cached column text outside document collections",
            );
        } finally {
            delete citation.sessions.runtime;
            Zotero.Integration.currentSession = previousSession;
        }

        const columns = pane.itemsView._getColumns();
        columns.find((column) => column.dataKey === views.columnKey).hidden = false;
        const index = pane.itemsView._rowMap[item.id];
        // Use the full virtual tree renderer, which assigns role="treeitem" in
        // Zotero 11. Never add test-only ARIA attributes to the generated row.
        const row = pane.itemsView.tree._renderItem(index);
        check(row.getAttribute("role") === "treeitem", "Zotero 11 generates a treeitem row");
        pane.itemsView.domEl.appendChild(row);
        const nativeDrag = pane.itemsView.onDragStart;
        const drag = new win.DragEvent("dragstart", {
            bubbles: true,
            cancelable: true,
            dataTransfer: new win.DataTransfer(),
        });
        row.querySelector(".cell").dispatchEvent(drag);
        check(drag.dataTransfer.getData("zotero/item") === String(item.id), "drag keeps the item flavor");
        check(drag.dataTransfer.getData("text/plain") === "", "drag suppresses Quick Copy text");
        check(views.draggedItems?.[0]?.id === item.id, "drag captures selected citation items");
        check(pane.itemsView.onDragStart === nativeDrag, "native drag method stays unchanged");
        views.handleInternalDrop();
        row.remove();

        // Exercise the original cite method and real citation window with a
        // fixture document backend. This does not write to Microsoft Word.
        const integration = Zotero.Integration;
        const nativeCite = integration.Session.prototype.cite;
        const nativeExec = integration.execCommand;
        const session = Object.create(integration.Session.prototype);
        Object.assign(session, {
            data: { prefs: { delayCitationUpdates: true } },
            citationsByItemID: { [item.id]: [] },
            style: { opt: { sort_citations: false } },
            progressBar: { hide: async () => {}, show() {} },
            _doc: { cleanup: async () => {} },
            addField: async () => ({ getNoteIndex: async () => 0, getCode: async () => "TEMP" }),
            addCitation: async () => {},
        });
        let inserted;
        session._insertCitingResult = async (_index, _field, citation) => {
            inserted = citation;
            citation.fieldIndex = 0;
            return [citation];
        };
        integration.execCommand = async () => {
            integration.currentDoc = session._doc;
            integration.currentSession = session;
            try {
                await session.cite();
                // Let chrome-load completion and pending first-show work finish.
                await Zotero.Promise.delay(250);
                const baseWindow = integration.currentWindow.docShell.treeOwner.QueryInterface(
                    Components.interfaces.nsIBaseWindow,
                );
                if (Zotero.isMac) {
                    const { ctypes } = ChromeUtils.importESModule("resource://gre/modules/ctypes.sys.mjs");
                    const objc = ctypes.open("/usr/lib/libobjc.A.dylib");
                    try {
                        const selector = objc.declare(
                            "sel_registerName",
                            ctypes.default_abi,
                            ctypes.voidptr_t,
                            ctypes.char.ptr,
                        );
                        const isVisible = objc.declare(
                            "objc_msgSend",
                            ctypes.default_abi,
                            ctypes.bool,
                            ctypes.voidptr_t,
                            ctypes.voidptr_t,
                        );
                        const handle = baseWindow.nativeHandle.replace(/^0x0x/, "0x");
                        const pointer = ctypes.voidptr_t(ctypes.UInt64(handle));
                        check(
                            !isVisible(pointer, selector("isVisible")),
                            "automatic citation native window is invisible",
                        );
                    } finally {
                        objc.close();
                    }
                }
                integration.currentWindow?.close();
                await Zotero.Promise.delay(100);
                check(inserted.citationItems[0]?.id === item.id, "native citation IO survives window close");
            } finally {
                integration.currentDoc = integration.currentWindow = false;
            }
        };
        try {
            await addon.api.citeItems([item]);
            await addon.api.citeItems([item]);
            check(integration.Session.prototype.cite === nativeCite, "native cite method stays unchanged");
        } finally {
            integration.execCommand = nativeExec;
        }
        await addon.hooks.onShutdown();
        await IOUtils.writeJSON(resultPath, { ok: true, zoteroVersion: Zotero.version, results });
    } catch (error) {
        await IOUtils.writeJSON(resultPath, { ok: false, results, error: String(error), stack: error.stack });
    } finally {
        Services.startup.quit(Services.startup.eAttemptQuit);
    }
})();
