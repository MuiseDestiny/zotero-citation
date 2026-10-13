import assert from "node:assert/strict";
import test from "node:test";
import { citeItems } from "../src/modules/cite";

const regular = (id: number): any => ({ id, isRegularItem: () => true });

function setup(exec?: (...args: any[]) => Promise<void>) {
    const observers = new Set<any>();
    const windows: any[] = [];
    let commands = 0;
    class IO {
        citation = { citationItems: [{ id: "1", locator: "2" }] as any[] };
        accepted = false;
        accept() {
            this.accepted = true;
        }
    }
    const integration: any = {
        Session: class {
            cite() {}
        },
        CitationEditInterface: IO,
        async execCommand(...args: any[]) {
            commands++;
            if (exec) return exec(...args);
            const dialog = open("chrome://zotero/content/integration/citationDialog.xhtml", new IO());
            integration.currentWindow = dialog;
            dialog.load();
        },
    };
    function open(url: string, io: any) {
        const listeners = new Map<string, any>();
        const baseWindow = { visibility: true, enabled: true };
        const dialog: any = {
            location: { href: url },
            arguments: [{ wrappedJSObject: io }],
            document: { documentElement: { removeAttribute() {} } },
            docShell: { treeOwner: { QueryInterface: () => baseWindow } },
            baseWindow,
            addEventListener: (name: string, handler: any) => listeners.set(name, handler),
            removeEventListener: (name: string) => listeners.delete(name),
            load() {
                let stopped = false;
                listeners.get("DOMContentLoaded")?.({ target: dialog.document });
                listeners.get("load")?.({
                    target: dialog.document,
                    stopImmediatePropagation: () => {
                        stopped = true;
                    },
                });
                return stopped;
            },
            listeners,
        };
        windows.push(dialog);
        for (const observer of observers) observer.observe(dialog, "domwindowopened");
        return dialog;
    }
    (globalThis as any).Components = {
        classes: {
            "@mozilla.org/embedcomp/window-watcher;1": {
                getService: () => ({
                    registerNotification: (observer: any) => observers.add(observer),
                    unregisterNotification: (observer: any) => observers.delete(observer),
                }),
            },
        },
        interfaces: { nsIWindowWatcher: {} },
    };
    (globalThis as any).Zotero = { Integration: integration, isMac: false };
    (globalThis as any).Zotero_Tabs = { selectedIndex: 0 };
    (globalThis as any).ZoteroPane = { getSelectedItems: () => [regular(1), regular(2)] };
    return { integration, IO, open, observers, windows, commands: () => commands };
}

test("accepts native citation IO without replacing Session.cite or losing locators", async () => {
    const mock = setup();
    const cite = mock.integration.Session.prototype.cite;
    const command = mock.integration.execCommand;
    await citeItems();
    assert.equal(mock.integration.Session.prototype.cite, cite);
    assert.equal(mock.integration.execCommand, command);
    const io = mock.windows[0].arguments[0].wrappedJSObject;
    assert.deepEqual(io.citation.citationItems, [{ id: "1", locator: "2" }, { id: 2 }]);
    assert.equal(io.accepted, true);
    assert.equal(mock.windows[0].baseWindow.visibility, false);
    assert.equal(mock.observers.size, 0);
    assert.equal(mock.windows[0].listeners.size, 0);
});

test("supports modern, quick format and classic dialogs while leaving document preferences alone", async () => {
    const mock = setup(async () => {
        const preferences = mock.open("chrome://zotero/content/integration/integrationDocPrefs.xhtml", {});
        mock.integration.currentWindow = preferences;
        assert.equal(preferences.load(), false);
        assert.equal(preferences.baseWindow.visibility, true);
        assert.equal(preferences.baseWindow.enabled, true);
        const url = `chrome://zotero/content/integration/${filename}`;
        const dialog = mock.open(url, new mock.IO());
        mock.integration.currentWindow = dialog;
        assert.equal(dialog.load(), true);
        assert.equal(dialog.baseWindow.visibility, false);
        assert.equal(dialog.arguments[0].wrappedJSObject.accepted, true);
    });
    let filename = "citationDialog.xhtml";
    for (filename of ["citationDialog.xhtml", "quickFormat.xhtml", "addCitationDialog.xhtml"]) await citeItems();
});

test("uses active-document integration and removes observers on command failure", async () => {
    let args: any[] = [];
    const failure = new Error("command failed");
    const mock = setup(async (...received) => {
        args = received;
        throw failure;
    });
    await assert.rejects(citeItems(), failure);
    assert.deepEqual(args, ["WinWord", "addEditCitation", "__doc__", 1]);
    assert.equal(mock.observers.size, 0);
    (globalThis as any).Zotero.isMac = true;
    await assert.rejects(citeItems(), failure);
    assert.deepEqual(args, ["MacWord16", "addEditCitation", "/Applications/Microsoft Word.app/", 2]);
});

test("does not take over another integration command or run for empty/standalone items", async () => {
    const mock = setup();
    mock.integration.currentDoc = {};
    await citeItems();
    mock.integration.currentDoc = false;
    await citeItems([]);
    await citeItems([{ isRegularItem: () => false, parentItem: undefined } as any]);
    assert.equal(mock.commands(), 0);
    assert.equal(mock.observers.size, 0);
});

test("snapshots and normalizes attachments and coalesces overlapping requests", async () => {
    let resolve!: () => void;
    const waiting = new Promise<void>((r) => {
        resolve = r;
    });
    const mock = setup(async () => {
        await waiting;
        const dialog = mock.open("chrome://zotero/content/integration/citationDialog.xhtml", new mock.IO());
        mock.integration.currentWindow = dialog;
        dialog.load();
    });
    const parent = regular(42);
    const first = citeItems([{ isRegularItem: () => false, parentItem: parent } as any, parent]);
    const second = citeItems([regular(99)]);
    resolve();
    await Promise.all([first, second]);
    assert.equal(mock.commands(), 1);
    assert.deepEqual(mock.windows[0].arguments[0].wrappedJSObject.citation.citationItems, [
        { id: "1", locator: "2" },
        { id: 42 },
    ]);
});
