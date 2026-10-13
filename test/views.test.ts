import assert from "node:assert/strict";
import test from "node:test";
import Views from "../src/modules/views";

function setup(modern = true, arrayResult = false) {
    const listeners = new Map<string, any>();
    const key = "plugin-citation";
    const item: any = { id: 1, isRegularItem: () => true };
    let selected = [item];
    let column: any;
    const inserted: number[][] = [];
    const removed: string[] = [];
    const manager: any = {
        async registerColumns(options: any) {
            column = options;
            return arrayResult ? [key] : key;
        },
        async unregisterColumns(value: string) {
            removed.push(value);
        },
    };
    if (modern) {
        manager.registerColumn = async (options: any) => {
            column = options;
            return key;
        };
        manager.unregisterColumn = manager.unregisterColumns;
    }
    const documentMock: any = {
        addEventListener: (name: string, handler: any) => listeners.set(name, handler),
        removeEventListener: (name: string) => listeners.delete(name),
        createElement: () => ({ style: {} }),
    };
    (globalThis as any).document = documentMock;
    (globalThis as any).addon = {
        data: { alive: true, locale: { current: { formatMessagesSync: () => [{ value: "Citation" }] } } },
        api: {
            citeItems: async (items: any[]) => {
                inserted.push(items.map((item) => item.id));
            },
        },
    };
    const view: any = {
        _columns: [{ dataKey: key, hidden: false }],
        domEl: { contains: (row: any) => row.inTree !== false },
        selection: { isSelected: () => true, select() {} },
        getSelectedItems: () => selected,
        getRow: () => ({ ref: selected[0] }),
        onDragStart() {},
    };
    (globalThis as any).ZoteroPane = { itemsView: view, collectionsView: { renderItem() {} } };
    (globalThis as any).Zotero = {
        isWin: true,
        ItemTreeManager: manager,
        ZoteroCitation: { api: { sessions: {} } },
        Integration: {},
        logError: (e: Error) => {
            throw e;
        },
    };
    return {
        listeners,
        view,
        inserted,
        removed,
        column: () => column,
        select: (items: any[]) => {
            selected = items;
        },
    };
}

function drag(column = "title", role = "treeitem"): any {
    const payload = new Map<string, string>();
    const row = { id: "item-tree-main-row-3", role };
    let stopped = false;
    return {
        target: {
            className: column,
            closest: (selector: string) => {
                if (selector === ".row[id]" || selector === `[role="${role}"]`) return row;
                return null;
            },
        },
        payload,
        stopImmediatePropagation: () => {
            stopped = true;
        },
        stopped: () => stopped,
        dataTransfer: {
            dropEffect: "none",
            setData: (type: string, value: string) => payload.set(type, value),
            setDragImage() {},
        },
    };
}

function wordTarget(word = true) {
    const pointer = { isNull: () => false };
    const ctypes: any = {
        winapi_abi: {},
        voidptr_t: {},
        uint32_t: {},
        int32_t: {},
        char16_t: {
            ptr: {},
            array: (length: number) => () => ({
                length,
                text: "",
                readString() {
                    return this.text;
                },
            }),
        },
        StructType: () => Object.assign(() => ({ address() {} }), { ptr: {} }),
        open: () => ({
            close() {},
            declare(name: string) {
                if (name === "GetCursorPos") return () => true;
                if (name === "WindowFromPoint" || name === "GetAncestor") return () => pointer;
                let call = 0;
                return (_window: any, buffer: any) => {
                    buffer.text = call++ ? "_WwG" : word ? "OpusApp" : "Chrome";
                };
            },
        }),
    };
    (globalThis as any).ChromeUtils = { importESModule: () => ({ ctypes }) };
}

test("modern and legacy registration results both enable dragging from every column", async () => {
    for (const [modern, array] of [
        [true, false],
        [false, false],
        [false, true],
    ]) {
        const mock = setup(modern, array);
        wordTarget();
        const views = new Views();
        const native = mock.view.onDragStart;
        await views.createCitationColumn();
        await views.dragCite();
        for (const column of ["title", "creator", "citation"]) {
            const event = drag(column);
            mock.listeners.get("dragstart")(event);
            assert.equal(event.stopped(), true);
            assert.deepEqual(
                [...event.payload],
                [
                    ["zotero/item", "1"],
                    ["text/plain", ""],
                ],
            );
            mock.listeners.get("dragend")(event);
        }
        assert.deepEqual(mock.inserted, [[1], [1], [1]]);
        assert.equal(mock.view.onDragStart, native);
        await views.clear();
        assert.deepEqual(mock.removed, ["plugin-citation"]);
        assert.equal(mock.listeners.size, 0);
    }
});

test("treeitem and row accessibility roles both produce quick citation drags", async () => {
    const mock = setup();
    const views = new Views();
    await views.createCitationColumn();
    await views.dragCite();
    for (const role of ["treeitem", "row"]) {
        const event = drag("title", role);
        mock.listeners.get("dragstart")(event);
        assert.equal(event.stopped(), true, role);
        assert.equal(event.payload.get("zotero/item"), "1", role);
    }
    await views.clear();
});

test("PDF, mixed, hidden-column and unrelated-tree drags reach native Quick Copy unchanged", async () => {
    const mock = setup();
    const views = new Views();
    await views.createCitationColumn();
    await views.dragCite();
    const regular = { id: 1, isRegularItem: () => true };
    const pdf = { id: 2, isRegularItem: () => false };
    for (const items of [[pdf], [regular, pdf]]) {
        mock.select(items);
        const event = drag();
        mock.listeners.get("dragstart")(event);
        assert.equal(event.stopped(), false);
    }
    mock.select([regular]);
    mock.view._columns[0].hidden = true;
    const event = drag();
    mock.listeners.get("dragstart")(event);
    assert.equal(event.stopped(), false);
    await views.clear();
});

test("captures dragged selection but rejects internal, Escape, native-cancelled and non-Word drops", async () => {
    const mock = setup();
    const views = new Views();
    await views.createCitationColumn();
    await views.dragCite();
    wordTarget();
    const start = () => {
        mock.select([{ id: 1, isRegularItem: () => true }]);
        const event = drag();
        mock.listeners.get("dragstart")(event);
        return event;
    };
    let event = start();
    mock.select([{ id: 99, isRegularItem: () => true }]);
    mock.listeners.get("dragend")(event);
    assert.deepEqual(mock.inserted, [[1]]);
    event = start();
    mock.listeners.get("drop")();
    mock.listeners.get("dragend")(event);
    event = start();
    mock.listeners.get("keydown")({ key: "Escape" });
    mock.listeners.get("dragend")(event);
    event = start();
    event.dataTransfer.mozUserCancelled = true;
    mock.listeners.get("dragend")(event);
    event = start();
    wordTarget(false);
    mock.listeners.get("dragend")(event);
    assert.deepEqual(mock.inserted, [[1]]);
    await views.clear();
});
