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
