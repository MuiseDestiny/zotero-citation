import assert from "node:assert/strict";
import test from "node:test";
import Views from "../src/modules/views";

function setup() {
    const listeners = new Map<string, (event: any) => void>();
    const columnKey = "zoterocitation-citation";
    const item: any = { id: 1, isRegularItem: () => true };
    let selected = [item];
    let nextDragSelection = [item];
    let column: any;
    let drags = 0;
    const unregistered: string[] = [];
    const inserted: any[] = [];
    const documentMock: any = {
        addEventListener: (name: string, handler: (event: any) => void) => listeners.set(name, handler),
        removeEventListener: (name: string) => listeners.delete(name),
        createElement: () => ({ style: {}, dataset: {} }),
    };
    (globalThis as any).document = documentMock;
    (globalThis as any).addon = {
        data: { locale: { current: { formatMessagesSync: () => [{ value: "Citation" }] } } },
        api: {
            citeItems: async (items: any[]) => {
                inserted.push(items.map((item) => item.id));
            },
        },
    };
    const itemsView = {
        _columns: [{ dataKey: columnKey, hidden: false }],
        selection: { selectedIndex: 0 },
        onDragStart(this: any, event: any, index: number) {
            assert.equal(this, itemsView);
            drags++;
            selected = nextDragSelection;
            this.selection.selectedIndex = index;
            event.dataTransfer.setData("application/x-zotero-items", "1");
            event.dataTransfer.setData("text/plain", "Native citation");
            return "native-result";
        },
    };
    const collectionsView = {
        renderItem() {},
        getRow() {
            return {};
        },
    };
    (globalThis as any).ZoteroPane = { itemsView, collectionsView, getSelectedItems: () => selected };
    (globalThis as any).Zotero = {
        isWin: true,
        ZoteroCitation: { api: { sessions: {} } },
        Integration: {},
        ItemTreeManager: {
            async registerColumns(options: any) {
                column = options;
                return columnKey;
            },
            async unregisterColumns(key: string) {
                unregistered.push(key);
            },
        },
        logError: (error: Error) => {
            throw error;
        },
    };
    return {
        listeners,
        itemsView,
        collectionsView,
        documentMock,
        unregistered,
        inserted,
        getColumn: () => column,
        getDrags: () => drags,
        select: (items: any[]) => {
            selected = items;
        },
        dragSelection: (items: any[]) => {
            nextDragSelection = items;
        },
    };
}

function drag(fromCitation = false): any {
    const payload = new Map<string, string>();
    return {
        payload,
        screenX: 500,
        screenY: 500,
        target: { closest: () => (fromCitation ? {} : null) },
        dataTransfer: {
            dropEffect: "copy",
            effectAllowed: "all",
            clearData: () => payload.clear(),
            setData: (type: string, data: string) => payload.set(type, data),
        },
    };
}

test("ordinary item and PDF drags retain native payloads and never trigger quick citation", async () => {
    const mock = setup();
    const views = new Views();
    await views.createCitationColumn();
    await views.dragCite();
    for (const regular of [true, false]) {
        mock.dragSelection([{ id: 2, isRegularItem: () => regular }]);
        const event = drag();
        const result = mock.itemsView.onDragStart(event, 3);
        mock.listeners.get("dragend")!(event);
        assert.equal(result, "native-result");
        assert.equal(mock.itemsView.selection.selectedIndex, 3);
        assert.deepEqual(
            [...event.payload],
            [
                ["application/x-zotero-items", "1"],
                ["text/plain", "Native citation"],
            ],
        );
    }
    assert.deepEqual(mock.inserted, []);
    await views.clear();
});

test("explicit citation drags use the original selection and reject non-Word or cancelled drops", async () => {
    const mock = setup();
    const views = new Views();
    await views.createCitationColumn();
    await views.dragCite();
    let word = true;
    const nullPointer = { isNull: () => false };
    const ctypes: any = {
        winapi_abi: {},
        voidptr_t: {},
        uint32_t: {},
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
        int32_t: {},
        StructType: () => Object.assign(() => ({ address: () => ({}) }), { ptr: {} }),
        open: () => ({
            close() {},
            declare: (name: string) => {
                if (name === "GetCursorPos") return () => true;
                if (name === "WindowFromPoint" || name === "GetAncestor") return () => nullPointer;
                if (name === "GetClassNameW") {
                    let call = 0;
                    return (_window: any, buffer: any) => {
                        buffer.text = call++ === 0 ? (word ? "OpusApp" : "Chrome_WidgetWin_1") : "_WwG";
                    };
                }
                throw new Error(name);
            },
        }),
    };
    (globalThis as any).ChromeUtils = { importESModule: () => ({ ctypes }) };
    let event = drag();
    const row = event.target;
    mock.listeners.get("mousedown")!({ button: 0, target: { closest: () => row } });
    event.currentTarget = row;
    mock.itemsView.onDragStart(event, 0);
    assert.deepEqual([...event.payload], [["text/plain", ""]]);
    mock.select([{ id: 99 }]);
    mock.listeners.get("dragend")!(event);
    await Promise.resolve();
    assert.deepEqual(mock.inserted, [[1]]);
    mock.dragSelection([{ id: 123, isRegularItem: () => false }]);
    event = drag(true);
    mock.itemsView.onDragStart(event, 0);
    assert.equal(event.payload.get("application/x-zotero-items"), "1");
    mock.listeners.get("dragend")!(event);
    assert.deepEqual(mock.inserted, [[1]]);

    word = false;
    event = drag(true);
    mock.itemsView.onDragStart(event, 0);
    mock.listeners.get("dragend")!(event);
    word = true;
    event = drag(true);
    mock.itemsView.onDragStart(event, 0);
    mock.listeners.get("keydown")!({ key: "Escape" });
    mock.listeners.get("dragend")!(event);
    event = drag(true);
    mock.itemsView.onDragStart(event, 0);
    event.dataTransfer.dropEffect = "none";
    mock.listeners.get("dragend")!(event);
    mock.dragSelection([{ id: 1, isRegularItem: () => true }]);
    event = drag(true);
    mock.itemsView.onDragStart(event, 0);
    mock.itemsView._columns[0].hidden = true;
    mock.listeners.get("dragend")!(event);
    assert.deepEqual(mock.inserted, [[1]]);
    await views.clear();
});

test("shutdown restores methods, unregisters the column and supports enabling again", async () => {
    const mock = setup();
    const originalDrag = mock.itemsView.onDragStart;
    const originalRender = mock.collectionsView.renderItem;
    for (let i = 0; i < 2; i++) {
        const views = new Views();
        await views.createCitationColumn();
        await views.patchIcon();
        await views.dragCite();
        await views.clear();
        assert.equal(mock.itemsView.onDragStart, originalDrag);
        assert.equal(mock.collectionsView.renderItem, originalRender);
        assert.equal(mock.listeners.size, 0);
    }
    assert.deepEqual(mock.unregistered, ["zoterocitation-citation", "zoterocitation-citation"]);
});

test("renders the citation cell into the owning document without relying on row DOM", async () => {
    const mock = setup();
    const views = new Views();
    await views.createCitationColumn();
    const cell = mock.getColumn().renderCell(0, "0: [1]", { className: "citation" }, false, mock.documentMock);
    assert.equal(cell.textContent, "[1]");
    assert.equal(cell.dataset.zoteroCitationDrag, "true");
    await views.clear();
});
