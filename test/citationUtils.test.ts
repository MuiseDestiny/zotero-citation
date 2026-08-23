import assert from "node:assert/strict";
import test from "node:test";

import { diffItemIDs, isLegacyCitationSearch, selectCitationSession } from "../src/modules/citationUtils";

test("detects only the all-items search produced by legacy releases", () => {
    assert.equal(
        isLegacyCitationSearch({
            0: { condition: "title", operator: "contains", value: "" },
        }),
        true,
    );
    assert.equal(
        isLegacyCitationSearch({
            0: { condition: "title", operator: "isEmpty", value: "" },
        }),
        false,
    );
    assert.equal(
        isLegacyCitationSearch({
            0: { condition: "title", operator: "contains", value: "" },
            1: { condition: "itemType", operator: "is", value: "book" },
        }),
        false,
    );
});

test("computes collection membership changes without duplicates", () => {
    assert.deepEqual(diffItemIDs([1, 2, 3], [2, 3, 4, 4]), {
        add: [4],
        remove: [1],
    });
});

test("falls back to the active session for ordinary collections", () => {
    const activeSession = { collection: { key: "document" } };
    const otherSession = { collection: { key: "other-document" } };

    assert.equal(
        selectCitationSession({ key: "document" }, [activeSession, otherSession], otherSession),
        activeSession,
    );
    assert.equal(selectCitationSession({ key: "my-library" }, [activeSession], activeSession), activeSession);
    assert.equal(selectCitationSession({}, [activeSession], activeSession), activeSession);
    assert.equal(selectCitationSession(undefined, [activeSession], activeSession), activeSession);
    assert.equal(selectCitationSession({ key: "my-library" }, [activeSession], undefined), undefined);
});
