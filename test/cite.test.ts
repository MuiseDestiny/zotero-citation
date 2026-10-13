import assert from "node:assert/strict";
import test from "node:test";

import { citeItems } from "../src/modules/cite";

function installZoteroMock(execCommand: (...args: any[]) => Promise<void>) {
    class Session {
        public async cite() {
            return undefined;
        }
    }

    (globalThis as any).Zotero = {
        isMac: false,
        Integration: {
            Session,
            currentSession: undefined,
            execCommand,
        },
    };
    (globalThis as any).addon = { data: { docId: "__doc__" } };
    (globalThis as any).Zotero_Tabs = { selectedIndex: 0 };
    (globalThis as any).ZoteroPane = { getSelectedItems: () => [regularItem(1)] };

    return Session;
}

test("restores the citation method after a successful command", async () => {
    const Session = installZoteroMock(async () => {
        assert.notEqual(Session.prototype.cite, originalCite);
    });
    const originalCite = Session.prototype.cite;

    await citeItems();

    assert.equal(Session.prototype.cite, originalCite);
});

function regularItem(id: number): any {
    return { id, isRegularItem: () => true };
}

test("uses the active Word document instead of a cached path or another integration agent", async () => {
    let args: any[] = [];
    installZoteroMock(async (...received) => {
        args = received;
    });
    (globalThis as any).addon.data.docId = "C:\\paper-A.docx";
    (globalThis as any).Zotero.Integration.currentSession = { agent: "http" };

    await citeItems();

    assert.deepEqual(args, ["WinWord", "addEditCitation", "__doc__", 1]);
});

test("keeps Mac Word integration targeting the active document", async () => {
    let args: any[] = [];
    installZoteroMock(async (...received) => {
        args = received;
    });
    (globalThis as any).Zotero.isMac = true;
    (globalThis as any).Zotero.Integration.currentSession = { agent: "http" };

    await citeItems();

    assert.deepEqual(args, ["MacWord16", "addEditCitation", "/Applications/Microsoft Word.app/", 2]);
});

test("does not start integration for an empty selection or a standalone PDF", async () => {
    let commands = 0;
    installZoteroMock(async () => {
        commands++;
    });
    (globalThis as any).ZoteroPane.getSelectedItems = () => [];
    await citeItems();
    (globalThis as any).Zotero_Tabs = { selectedIndex: 1, selectedID: "pdf" };
    (globalThis as any).Zotero.Reader = { getByTabID: () => ({ itemID: 123 }) };
    (globalThis as any).Zotero.Items = { get: () => ({ isRegularItem: () => false, parentItem: undefined }) };
    await citeItems();
    (globalThis as any).Zotero.Reader.getByTabID = () => undefined;
    await citeItems();
    assert.equal(commands, 0);
});

function installCitationMock(options: { existing?: boolean; failAt?: string } = {}) {
    const state = { deleted: 0, insertedIDs: [] as number[], commands: 0 };
    const failure = new Error("integration failed");
    const Session = installZoteroMock(async () => {
        state.commands++;
        await session.cite(options.existing ? {} : undefined);
    });
    class Field {
        public type = 1;
        public _field = {};
        async unserialize() {
            return {};
        }
        async getNoteIndex() {
            return 0;
        }
        async delete() {
            state.deleted++;
        }
    }
    const field = new Field();
    const integration = (globalThis as any).Zotero.Integration;
    integration.Field = { loadExisting: async () => field };
    integration.CitationField = class extends Field {};
    integration.Citation = class {
        citationItems: { id: number }[] = [];
        async prepareForEditing() {
            if (options.failAt === "prepare") throw failure;
        }
    };
    integration.CitationEditInterface = class {
        constructor(public citation: any) {}
    };
    (globalThis as any).Zotero.Promise = Promise;
    (globalThis as any).Zotero.logError = () => {};
    const session = new Session();
    Object.assign(session, {
        data: { prefs: { delayCitationUpdates: options.failAt !== "load" && options.failAt !== "afterInsert" } },
        citationsByItemID: { 1: [] },
        style: { opt: {} },
        addField: async () => ({}),
        getFields: async () => [],
        updateFromDocument: async () => {
            if (options.failAt === "load" || (options.failAt === "afterInsert" && state.insertedIDs.length))
                throw failure;
        },
        _insertCitingResult: async (_index: number, _field: any, citation: any) => {
            if (options.failAt === "insert") throw failure;
            state.insertedIDs = citation.citationItems.map((item: any) => item.id);
            return [{ fieldIndex: 0, field }];
        },
        addCitation: async () => {},
    });
    return { state, failure };
}

test("normalizes reader attachments and uses the captured drag selection", async () => {
    const { state } = installCitationMock();
    const parent = regularItem(42);
    const attachment: any = { id: 43, isRegularItem: () => false, parentItem: parent };
    (globalThis as any).Zotero_Tabs = { selectedIndex: 1, selectedID: "pdf" };
    (globalThis as any).Zotero.Reader = { getByTabID: () => ({ itemID: 43 }) };
    (globalThis as any).Zotero.Items = { get: () => attachment };
    await citeItems();
    assert.deepEqual(state.insertedIDs, [42]);

    await citeItems([regularItem(5), regularItem(5), regularItem(6)]);
    assert.deepEqual(state.insertedIDs, [5, 6]);
});

test("removes new placeholders on preparation, document loading and insertion failures", async () => {
    for (const failAt of ["prepare", "load", "insert"]) {
        const { state, failure } = installCitationMock({ failAt });
        await assert.rejects(citeItems(), failure);
        assert.equal(state.deleted, 1, failAt);
    }
});

test("preserves existing and successfully inserted fields on errors", async () => {
    for (const options of [{ existing: true, failAt: "insert" }, { failAt: "afterInsert" }]) {
        const { state, failure } = installCitationMock(options);
        await assert.rejects(citeItems(), failure);
        assert.equal(state.deleted, 0);
    }
});

test("restores the citation method when the command fails", async () => {
    const failure = new Error("command failed");
    const Session = installZoteroMock(async () => {
        throw failure;
    });
    const originalCite = Session.prototype.cite;

    await assert.rejects(citeItems(), failure);

    assert.equal(Session.prototype.cite, originalCite);
});

test("coalesces overlapping shortcut requests", async () => {
    let resolveCommand!: () => void;
    let commandCalls = 0;
    const command = new Promise<void>((resolve) => {
        resolveCommand = resolve;
    });
    installZoteroMock(async () => {
        commandCalls += 1;
        await command;
    });

    const first = citeItems();
    const second = citeItems();
    assert.equal(commandCalls, 1);

    resolveCommand();
    await Promise.all([first, second]);
});

test("restores native citation behavior inside wrappers installed during a command", async () => {
    let outer: any;
    const Session = installZoteroMock(async () => {
        const patched = Session.prototype.cite;
        outer = function (this: any, ...args: any[]) {
            return patched.apply(this, args as any);
        };
        Session.prototype.cite = outer;
    });
    await citeItems();
    assert.equal(Session.prototype.cite, outer);
    assert.equal(await new Session().cite(), undefined);
});
