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
    let quickCopyCalls = 0;
    let failDrag = false;
    let lateExport: (() => void) | undefined;
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
            event.dataTransfer.setData("zotero/item", selected.map((item: any) => item.id).join(","));
            event.dataTransfer.effectAllowed = "copyMove";
            const quickCopy = (globalThis as any).Zotero.QuickCopy.getContentFromItems;
            const content = quickCopy(selected, {}, (data: any) => event.dataTransfer.setData("text/plain", data.text));
            if (content) {
                event.dataTransfer.setData("text/plain", content.text);
                event.dataTransfer.setData("text/html", content.html);
            }
            if (selected.some((item: any) => !item.isRegularItem())) {
                event.dataTransfer.setData("application/x-moz-file", "paper.pdf");
            }
            if (failDrag) throw new Error("native drag failed");
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
        QuickCopy: {
            getContentFromItems(_items: any[], _format: any, callback: (data: any) => void) {
                quickCopyCalls++;
                lateExport = () => callback({ text: "Late export" });
                return { text: "Native citation", html: "<p>Native citation</p>" };
            },
        },
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
        getQuickCopyCalls: () => quickCopyCalls,
        runLateExport: () => lateExport?.(),
        failDrag: () => {
            failDrag = true;
        },
        select: (items: any[]) => {
            selected = items;
        },
        dragSelection: (items: any[]) => {
            nextDragSelection = items;
        },
    };
}

function drag(): any {
    const payload = new Map<string, string>();
    return {
        payload,
        screenX: 500,
        screenY: 500,
        target: {},
        dataTransfer: {
            dropEffect: "copy",
            effectAllowed: "all",
            clearData: (type?: string) => (type ? payload.delete(type) : payload.clear()),
            setData: (type: string, data: string) => payload.set(type, data),
        },
    };
}

function installWordTargetMock() {
    let word = true;
    const nullPointer = { isNull: () => false };
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
    return {
        setWord: (value: boolean) => {
            word = value;
        },
    };
}

test("drags from any column keep collection data and suppress duplicate Quick Copy text", async () => {
    const mock = setup();
    const target = installWordTargetMock();
    target.setWord(false);
    const views = new Views();
    await views.createCitationColumn();
    await views.dragCite();
    const originalQuickCopy = (globalThis as any).Zotero.QuickCopy.getContentFromItems;
    for (const column of ["title", "creator", "citation"]) {
        mock.dragSelection([
            { id: 2, isRegularItem: () => true },
            { id: 3, isRegularItem: () => true },
        ]);
        const event = drag();
        event.target = { className: `cell ${column}` };
        const result = mock.itemsView.onDragStart(event, 3);
        mock.listeners.get("dragend")!(event);
        assert.equal(result, "native-result");
        assert.equal(mock.itemsView.selection.selectedIndex, 3);
        assert.deepEqual(
            [...event.payload],
            [
                ["zotero/item", "2,3"],
                ["text/plain", ""],
            ],
        );
        assert.equal(event.dataTransfer.effectAllowed, "copyMove");
    }
    mock.runLateExport();
    assert.equal(mock.getQuickCopyCalls(), 0);
    assert.equal((globalThis as any).Zotero.QuickCopy.getContentFromItems, originalQuickCopy);
    assert.deepEqual(mock.inserted, []);
    await views.clear();
});

test("PDF and mixed drags preserve their native file and text payloads even over Word", async () => {
    const mock = setup();
    installWordTargetMock();
    const views = new Views();
    await views.createCitationColumn();
    await views.dragCite();
    const pdf = { id: 2, isRegularItem: () => false };
    const regular = { id: 3, isRegularItem: () => true };
    for (const items of [[pdf], [regular, pdf]]) {
        mock.dragSelection(items);
        const event = drag();
        mock.itemsView.onDragStart(event, 0);
        mock.listeners.get("dragend")!(event);
        assert.equal(event.payload.get("application/x-moz-file"), "paper.pdf");
        assert.equal(event.payload.get("text/plain"), "Native citation");
        assert.equal(event.payload.get("text/html"), "<p>Native citation</p>");
    }
    assert.equal(mock.getQuickCopyCalls(), 2);
    assert.deepEqual(mock.inserted, []);
    await views.clear();
});

test("hiding the citation column restores full native dragging and Quick Copy", async () => {
    const mock = setup();
    installWordTargetMock();
    mock.itemsView._columns[0].hidden = true;
    const views = new Views();
    await views.createCitationColumn();
    await views.dragCite();
    const event = drag();
    mock.itemsView.onDragStart(event, 0);
    mock.listeners.get("dragend")!(event);
    assert.equal(mock.getQuickCopyCalls(), 1);
    assert.equal(event.payload.get("text/plain"), "Native citation");
    assert.deepEqual(mock.inserted, []);
    await views.clear();
});

test("restores Quick Copy even if native drag handling throws", async () => {
    const mock = setup();
    const views = new Views();
    await views.createCitationColumn();
    await views.dragCite();
    const original = (globalThis as any).Zotero.QuickCopy.getContentFromItems;
    mock.failDrag();
    assert.throws(() => mock.itemsView.onDragStart(drag(), 0), /native drag failed/);
    assert.equal((globalThis as any).Zotero.QuickCopy.getContentFromItems, original);
    await views.clear();
});

test("any-column drags use the original selection and reject non-Word or cancelled drops", async () => {
    const mock = setup();
    const views = new Views();
    await views.createCitationColumn();
    await views.dragCite();
    const target = installWordTargetMock();
    let event = drag();
    mock.itemsView.onDragStart(event, 0);
    assert.deepEqual(
        [...event.payload],
        [
            ["zotero/item", "1"],
            ["text/plain", ""],
        ],
    );
    mock.select([{ id: 99 }]);
    mock.listeners.get("dragend")!(event);
    await Promise.resolve();
    assert.deepEqual(mock.inserted, [[1]]);
    mock.dragSelection([{ id: 123, isRegularItem: () => false }]);
    event = drag();
    mock.itemsView.onDragStart(event, 0);
    assert.equal(event.payload.get("zotero/item"), "123");
    mock.listeners.get("dragend")!(event);
    assert.deepEqual(mock.inserted, [[1]]);

    mock.dragSelection([{ id: 1, isRegularItem: () => true }]);
    target.setWord(false);
    event = drag();
    mock.itemsView.onDragStart(event, 0);
    mock.listeners.get("dragend")!(event);
    target.setWord(true);
    event = drag();
    mock.itemsView.onDragStart(event, 0);
    mock.listeners.get("keydown")!({ key: "Escape" });
    mock.listeners.get("dragend")!(event);
    event = drag();
    mock.itemsView.onDragStart(event, 0);
    event.dataTransfer.dropEffect = "none";
    mock.listeners.get("dragend")!(event);
    mock.dragSelection([{ id: 1, isRegularItem: () => true }]);
    event = drag();
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
    assert.equal(cell.dataset.zoteroCitationDrag, undefined);
    await views.clear();
});
