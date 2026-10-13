import assert from "node:assert/strict";
import test from "node:test";
import { matchWordDocumentNames, readWordDocuments } from "../src/modules/wordDocuments";

test("matches real names by document session metadata, including unsaved and non-active documents", () => {
    (globalThis as any).Zotero = {
        Integration: {
            DocumentData: class {
                sessionID: string;
                constructor(data: string) {
                    this.sessionID = JSON.parse(data).sessionID;
                }
            },
        },
    };
    const documents = [
        { name: "文档1", data: '{"sessionID":"A"}' },
        { name: "论文 #1.docx", data: '{"sessionID":"B"}' },
        { name: "Unrelated.docx", data: "" },
    ];
    assert.deepEqual(
        [...matchWordDocumentNames(documents)],
        [
            ["A", "文档1"],
            ["B", "论文 #1.docx"],
        ],
    );
    documents.push({ name: "Copy.docx", data: '{"sessionID":"A"}' });
    assert.deepEqual([...matchWordDocumentNames(documents)], [["B", "论文 #1.docx"]]);
});

test("macOS reads full Unicode document names without using application paths or window captions", async () => {
    (globalThis as any).Zotero = {
        isMac: true,
    };
    (globalThis as any).ChromeUtils = {
        importESModule: () => ({
            Subprocess: {
                call: async ({ command, arguments: args }: any) => {
                    assert.equal(command, "/usr/bin/osascript");
                    assert.ok(args[1].includes("ZOTERO_PREF_"));
                    assert.ok(args[1].includes("get documents"));
                    let read = false;
                    return {
                        stdout: {
                            readString: async () => {
                                if (read) return "";
                                read = true;
                                return '文档1\x1f{"sessionID":"A"}\x1e论文.docx\x1f{"sessionID":"B"}\x1e\n';
                            },
                        },
                        wait: async () => ({ exitCode: 0 }),
                    };
                },
            },
        }),
    };
    assert.deepEqual(await readWordDocuments(), [
        { name: "文档1", data: '{"sessionID":"A"}' },
        { name: "论文.docx", data: '{"sessionID":"B"}' },
    ]);
});
