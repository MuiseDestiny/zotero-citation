import assert from "node:assert/strict";
import test from "node:test";
import { patchMethod } from "../src/modules/patch";

test("restores patched methods and keeps their receiver and return value", () => {
    const target = {
        value: 5,
        method(n: number) {
            return this.value + n;
        },
    };
    const original = target.method;
    const restore = patchMethod(
        target,
        "method",
        (original) =>
            function (this: typeof target, n: number) {
                return original.call(this, n) * 2;
            },
    );
    assert.equal(target.method(3), 16);
    restore();
    restore();
    assert.equal(target.method, original);
    assert.equal(target.method(3), 8);
});

test("disables its own behavior without overwriting another plugin's wrapper", () => {
    const target = { method: () => "native" };
    const restore = patchMethod(target, "method", (original) => () => `citation:${original()}`);
    const patched = target.method;
    const otherPlugin = () => `other:${patched()}`;
    target.method = otherPlugin;
    restore();
    assert.equal(target.method, otherPlugin);
    assert.equal(target.method(), "other:native");
});
