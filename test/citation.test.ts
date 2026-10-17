import assert from "node:assert/strict";
import test from "node:test";
import Citation from "../src/modules/citation";

test("startup preserves saved searches and deletes only recorded temporary collections", async () => {
    const erased: string[] = [];
    const collection = (key: string, relations: string[] = []) => ({
        key,
        async loadDataType() {},
        getRelationsByPredicate: () => relations,
        async eraseTx() {
            erased.push(key);
        },
    });
    let storedKeys = '["owned"]';
    (globalThis as any).Zotero = {
        ZoteroCitation: { api: {} },
        Libraries: { userLibraryID: 1 },
        Prefs: {
            get: () => storedKeys,
            set: (_key: string, value: string) => {
                storedKeys = value;
            },
        },
        Collections: {
            getByLibrary: () => [
                collection("owned"),
                collection("legacy", ["https://github.com/MuiseDestiny/zotero-citation#temporary-collection"]),
                collection("user"),
            ],
        },
        Searches: {
            getByLibrary: () => [
                {
                    getConditions: () => ({ 0: { condition: "title", operator: "contains", value: "" } }),
                    async eraseTx() {
                        erased.push("user-search");
                    },
                },
            ],
        },
        logError: (error: Error) => {
            throw error;
        },
    };

    await (new Citation() as any).clearStaleArtifacts();

    assert.deepEqual(erased, ["owned", "legacy"]);
    assert.equal(storedKeys, "[]");
});

test("document renames follow the matched session and preserve manual collection names", async () => {
    (globalThis as any).Zotero = { ZoteroCitation: { api: {} } };
    const citation = new Citation() as any;
    citation.sessions.A = { collection: { name: "A", async saveTx() {} }, lastName: "A" };
    citation.sessions.B = { collection: { name: "B", async saveTx() {} }, lastName: "B" };
    await citation.renameCollection("A", "文档1");
    await citation.renameCollection("A", "论文.docx");
    assert.equal(citation.sessions.A.collection.name, "论文.docx");
    assert.equal(citation.sessions.B.collection.name, "B");
    citation.sessions.A.collection.name = "My collection";
    await citation.renameCollection("A", "Renamed.docx");
    assert.equal(citation.sessions.A.collection.name, "My collection");
});

test("citation labels redraw removed and added items without reloading the item list", async () => {
    const redraws: any[] = [];
    (globalThis as any).Zotero = {
        ZoteroCitation: { api: {} },
        Libraries: { userLibraryID: 1 },
        Items: { get: (id: number) => ({ id, libraryID: 1 }) },
        Notifier: {
            trigger: async (...args: any[]) => {
                redraws.push(args);
            },
        },
    };
    (globalThis as any).ZoteroPane = {
        itemsView: {
            refreshAndMaintainSelection() {
                throw new Error("must not reload the item list");
            },
        },
    };
    const citation = new Citation() as any;
    citation.sessions.A = { idData: { 1: { plainCitation: "0: [1]" } } };
    await citation.updateCitations("A", { 2: [{ properties: { plainCitation: "[1]" } }] }, [2], "in-text");
    assert.deepEqual(redraws, [["redraw", "item", [1, 2]]]);
});

test("embedded collaborator IDs do not interrupt synchronization of local cited items", async () => {
    const added: number[][] = [];
    const removed: number[][] = [];
    (globalThis as any).Zotero = {
        ZoteroCitation: { api: {} },
        Libraries: { userLibraryID: 1 },
        Items: {
            get(id: number) {
                assert.ok(Number.isSafeInteger(id) && id > 0);
                return { id, libraryID: id === 3 ? 2 : 1 };
            },
        },
        DB: { executeTransaction: async (fn: () => Promise<void>) => fn() },
        Notifier: { trigger: async () => {} },
    };
    const citation = new Citation();
    citation.sessions.A = {
        idData: {},
        lastName: "Document",
        pending: false,
        collection: {
            getChildItems: () => [99],
            addItems: async (ids: number[]) => added.push(ids),
            removeItems: async (ids: number[]) => removed.push(ids),
        } as any,
    };
    const entry = { properties: { plainCitation: "[1, 2]" } };
    const ids = citation.getSortedItemIDs({ 0: { citationItems: [{ id: "session/key" }, { id: "2" }, { id: 3 }] } });
    assert.deepEqual(ids, [2, 3]);
    await citation.updateCitations("A", { "session/key": [entry], 2: [entry], 3: [entry] }, ids, "in-text");
    assert.deepEqual(added, [[2]]);
    assert.deepEqual(removed, [[99]]);
    assert.deepEqual(Object.keys(citation.sessions.A.idData), ["2", "3"]);
});

test("switching Word sessions redraws unchanged citation labels", async () => {
    const redraws: any[] = [];
    const session = (label: string) => ({
        collection: { name: "Document" },
        idData: { 1: { plainCitation: label } },
    });
    const integration: any = {
        sessions: { A: { agent: "WinWord" }, B: { agent: "WinWord" } },
        currentSession: { sessionID: "A" },
    };
    (globalThis as any).Zotero = {
        ZoteroCitation: { api: {} },
        Integration: integration,
        Notifier: { trigger: async (...args: any[]) => redraws.push(args) },
    };
    const citation = new Citation() as any;
    citation.sessions = { A: session("0: [1]"), B: session("0: [5]") };
    citation.nextNameRefresh = Infinity;
    citation.updateCitations = async () => {};
    await citation.pollSessions();
    await citation.pollSessions();
    integration.currentSession = { sessionID: "B" };
    await citation.pollSessions();
    assert.deepEqual(redraws, [
        ["redraw", "item", [1]],
        ["redraw", "item", [1]],
    ]);
});

test("citation redraw clears cached custom-column text in every Zotero window", async () => {
    const modern: number[][] = [];
    const legacy = { _rowCache: { 1: "stale", 2: "unchanged" } as Record<number, string> };
    (globalThis as any).Zotero = {
        ZoteroCitation: { api: {} },
        getMainWindows: () => [
            { ZoteroPane: { itemsView: legacy } },
            { ZoteroPane: { itemsView: { invalidateRowCache: (ids: number[]) => modern.push(ids) } } },
        ],
        Notifier: {
            trigger: async () => {
                assert.equal(legacy._rowCache[1], undefined);
                assert.equal(legacy._rowCache[2], "unchanged");
                assert.deepEqual(modern, [[1]]);
            },
        },
    };
    await (new Citation() as any).redrawCitationItems([1]);
});
