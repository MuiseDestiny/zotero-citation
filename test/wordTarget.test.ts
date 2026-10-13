import assert from "node:assert/strict";
import test from "node:test";
import { isWordDropTarget } from "../src/modules/wordTarget";

test("macOS detects the window under the drop and releases native resources", () => {
    let windows: any[] = [];
    let released = 0;
    let closed = 0;
    const pointer = (value: any): any => ({ value, isNull: () => value === undefined });
    const struct: any = () => ({
        address() {
            return this;
        },
    });
    struct.ptr = {};
    const int32: any = () => ({
        value: 0,
        address() {
            return this;
        },
    });
    const ctypes: any = {
        voidptr_t: {},
        default_abi: {},
        long: {},
        bool: {},
        int: {},
        uint32_t: {},
        void_t: {},
        double: {},
        int32_t: int32,
        char: {
            ptr: {},
            array: (length: number) => () => ({
                length,
                text: "",
                readString() {
                    return this.text;
                },
            }),
        },
        StructType: () => struct,
        open: () => ({
            close() {
                closed++;
            },
            declare(name: string) {
                if (name.startsWith("kCG")) return pointer(name);
                switch (name) {
                    case "CGWindowListCopyWindowInfo":
                        return () => pointer(windows);
                    case "CFArrayGetCount":
                        return () => ({ toString: () => String(windows.length) });
                    case "CFArrayGetValueAtIndex":
                        return (_array: any, i: number) => pointer(windows[i]);
                    case "CFDictionaryGetValue":
                        return (dictionary: any, key: any) => pointer(dictionary.value[key.value]);
                    case "CFNumberGetValue":
                        return (number: any, _type: any, output: any) => {
                            output.value = number.value;
                            return true;
                        };
                    case "CGRectMakeWithDictionaryRepresentation":
                        return (bounds: any, output: any) => {
                            Object.assign(output, {
                                origin: { x: bounds.value.x, y: bounds.value.y },
                                size: { width: bounds.value.width, height: bounds.value.height },
                            });
                            return true;
                        };
                    case "CFStringGetCString":
                        return (string: any, output: any) => {
                            output.text = string.value;
                            return true;
                        };
                    case "CFRelease":
                        return () => {
                            released++;
                        };
                    default:
                        throw new Error(name);
                }
            },
        }),
    };
    const errors: unknown[] = [];
    (globalThis as any).Zotero = { isMac: true, logError: (error: unknown) => errors.push(error) };
    (globalThis as any).ChromeUtils = { importESModule: () => ({ ctypes }) };
    const bounds = { x: 100, y: 100, width: 500, height: 500 };
    const window = (owner: string, layer = 0, box = bounds) => ({
        kCGWindowOwnerName: owner,
        kCGWindowLayer: layer,
        kCGWindowBounds: box,
    });
    windows = [window("Drag image", 25), window("Microsoft Word")];
    assert.equal(isWordDropTarget({ screenX: 200, screenY: 200 }), true);
    windows = [window("Google Chrome"), window("Microsoft Word")];
    assert.equal(isWordDropTarget({ screenX: 200, screenY: 200 }), false);
    windows = [window("Microsoft Word", 0, { ...bounds, x: 1000 })];
    assert.equal(isWordDropTarget({ screenX: 200, screenY: 200 }), false);
    assert.equal(released, 3);
    assert.equal(closed, 6);
    assert.deepEqual(errors, []);

    (globalThis as any).ChromeUtils = {
        importESModule() {
            throw new Error("ESM unavailable");
        },
        import: (path: string) => {
            assert.equal(path, "resource://gre/modules/ctypes.jsm");
            return { ctypes };
        },
    };
    windows = [window("Microsoft Word")];
    assert.equal(isWordDropTarget({ screenX: 200, screenY: 200 }), true);
});

test("does not insert a citation when native target detection is unavailable", () => {
    const errors: unknown[] = [];
    (globalThis as any).Zotero = { isMac: true, logError: (error: unknown) => errors.push(error) };
    (globalThis as any).ChromeUtils = {
        importESModule: () => ({
            ctypes: {
                open: () => {
                    throw new Error("unavailable");
                },
            },
        }),
    };
    assert.equal(isWordDropTarget({ screenX: 0, screenY: 0 }), false);
    assert.equal(errors.length, 1);
});
