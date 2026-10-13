import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { build } from "esbuild";

test("production bundle starts and shuts down without removed toolkit APIs", async () => {
    const result = await build({
        entryPoints: ["src/index.ts"],
        bundle: true,
        target: "firefox102",
        define: { __env__: '"production"' },
        write: false,
    });
    const errors = [];
    const listeners = new Map();
    let column;
    const mainWindow = {
        Localization: class {
            formatMessagesSync() {
                return [{ value: "Citation" }];
            }
        },
        document: {
            addEventListener(name, listener) {
                listeners.set(name, listener);
            },
            removeEventListener(name) {
                listeners.delete(name);
            },
        },
        ZoteroPane: {
            itemsView: { onDragStart() {} },
            collectionsView: { renderItem() {} },
        },
        Zotero_Tabs: { selectedIndex: 0 },
        addEventListener() {},
        removeEventListener() {},
        setInterval() {
            return 1;
        },
        clearInterval() {},
        console,
    };
    const originalDrag = mainWindow.ZoteroPane.itemsView.onDragStart;
    const Zotero = {
        getMainWindow: () => mainWindow,
        initializationPromise: Promise.resolve(),
        unlockPromise: Promise.resolve(),
        uiReadyPromise: Promise.resolve(),
        Libraries: { userLibraryID: 1 },
        Collections: { getByLibrary: () => [] },
        Prefs: { get() {}, set() {} },
        Integration: { sessions: {}, async execCommand() {} },
        ItemTreeManager: {
            async registerColumns(options) {
                column = options;
                return "citation";
            },
            async unregisterColumns() {
                column = undefined;
            },
        },
        logError: (error) => errors.push(error),
    };
    const sandbox = {
        Zotero,
        ChromeUtils: {
            import() {
                throw new Error("ChromeUtils.import removed");
            },
        },
    };
    sandbox._globalThis = sandbox;
    const context = vm.createContext(sandbox);
    for (let i = 0; i < 2; i++) {
        vm.runInContext(result.outputFiles[0].text, context);
        await new Promise((resolve) => setImmediate(resolve));
        assert.equal(column?.dataKey, "citation");
        assert.equal(listeners.has("keydown"), true);
        await Zotero.ZoteroCitation.hooks.onShutdown();
        assert.equal(Zotero.ZoteroCitation, undefined);
        assert.equal(column, undefined);
        assert.equal(listeners.size, 0);
        assert.equal(mainWindow.ZoteroPane.itemsView.onDragStart, originalDrag);
    }
    let ready;
    Zotero.initializationPromise = new Promise((resolve) => {
        ready = resolve;
    });
    vm.runInContext(result.outputFiles[0].text, context);
    const shutdown = Zotero.ZoteroCitation.hooks.onShutdown();
    ready();
    await shutdown;
    assert.equal(Zotero.ZoteroCitation, undefined);
    assert.equal(column, undefined);
    assert.equal(listeners.size, 0);
    assert.equal(mainWindow.ZoteroPane.itemsView.onDragStart, originalDrag);
    assert.deepEqual(errors, []);
    assert.equal(result.outputFiles[0].text.includes("Console.jsm"), false);
});
