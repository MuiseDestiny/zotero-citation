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

test("integration patches remain inert after shutdown even when another plugin wraps them", async () => {
    let commands = 0;
    (globalThis as any).Zotero = {
        ZoteroCitation: { api: {} },
        Integration: {
            execCommand: async () => {
                commands++;
            },
        },
    };
    const citation = new Citation() as any;
    citation.patchExecCommand();
    const patched = (globalThis as any).Zotero.Integration.execCommand;
    const otherPlugin = (...args: any[]) => patched(...args);
    (globalThis as any).Zotero.Integration.execCommand = otherPlugin;
    citation.restoreExecCommand();
    assert.equal((globalThis as any).Zotero.Integration.execCommand, otherPlugin);
    await otherPlugin("WinWord", "refresh", "C:/paper.docx");
    assert.equal(commands, 1);
});

test("delayed collection renames keep the session that issued the integration command", async () => {
    (globalThis as any).Zotero = {
        ZoteroCitation: { api: {} },
        Integration: { currentSession: { sessionID: "B" } },
    };
    (globalThis as any).PathUtils = { split: (path: string) => path.split("/") };
    const citation = new Citation() as any;
    citation.sessions.A = { collection: { name: "A", async saveTx() {} }, lastName: "A" };
    citation.sessions.B = { collection: { name: "B", async saveTx() {} }, lastName: "B" };
    await citation.renameCurrentCollection("C:/paper-A.docx", "A");
    assert.equal(citation.sessions.A.collection.name, "paper-A.docx");
    assert.equal(citation.sessions.B.collection.name, "B");
});
