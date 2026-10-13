import assert from "node:assert/strict";
import test from "node:test";
import Citation from "../src/modules/citation";

test("startup preserves saved searches and deletes only recorded temporary collections", async () => {
    const erased: string[] = [];
    const collection = (key: string, relations: string[] = []) => ({
        key,
        async loadDataType() {},
        getRelationsByPredicate: () => relations,
        async eraseTx() { erased.push(key); },
    });
    let storedKeys = '["owned"]';
    (globalThis as any).Zotero = {
        ZoteroCitation: { api: {} },
        Libraries: { userLibraryID: 1 },
        Prefs: { get: () => storedKeys, set: (_key: string, value: string) => { storedKeys = value; } },
        Collections: { getByLibrary: () => [
            collection("owned"),
            collection("legacy", ["https://github.com/MuiseDestiny/zotero-citation#temporary-collection"]),
            collection("user"),
        ] },
        Searches: { getByLibrary: () => [{
            getConditions: () => ({ 0: { condition: "title", operator: "contains", value: "" } }),
            async eraseTx() { erased.push("user-search"); },
        }] },
        logError: (error: Error) => { throw error; },
    };

    await (new Citation() as any).clearStaleArtifacts();

    assert.deepEqual(erased, ["owned", "legacy"]);
    assert.equal(storedKeys, "[]");
});
