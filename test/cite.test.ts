import assert from "node:assert/strict";
import test from "node:test";

import { citeItems } from "../src/modules/cite";
import "./citationUtils.test";

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
