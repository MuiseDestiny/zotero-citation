function isWindowsWordTarget(ctypes: any): boolean {
    const library = ctypes.open("user32.dll");
    try {
        const abi = ctypes.winapi_abi;
        const pointType = ctypes.StructType("POINT", [{ x: ctypes.int32_t }, { y: ctypes.int32_t }]);
        const getCursorPos = library.declare("GetCursorPos", abi, ctypes.int32_t, pointType.ptr);
        const windowFromPoint = library.declare("WindowFromPoint", abi, ctypes.voidptr_t, pointType);
        const getAncestor = library.declare("GetAncestor", abi, ctypes.voidptr_t, ctypes.voidptr_t, ctypes.uint32_t);
        const getClassName = library.declare(
            "GetClassNameW",
            abi,
            ctypes.int32_t,
            ctypes.voidptr_t,
            ctypes.char16_t.ptr,
            ctypes.int32_t,
        );
        const point = pointType();
        if (!getCursorPos(point.address())) {
            return false;
        }
        const target = windowFromPoint(point);
        if (target.isNull()) {
            return false;
        }
        const buffer = ctypes.char16_t.array(256)();
        const root = getAncestor(target, 2); // GA_ROOT
        getClassName(root, buffer, buffer.length);
        if (buffer.readString() !== "OpusApp") {
            return false;
        }
        // Word's document surface, excluding its ribbon and other controls.
        getClassName(target, buffer, buffer.length);
        return buffer.readString() === "_WwG";
    } finally {
        library.close();
    }
}

function isMacWordTarget(ctypes: any): boolean {
    const cf = ctypes.open("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation");
    let cg: any;
    let windows: any;
    try {
        cg = ctypes.open("/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics");
        const abi = ctypes.default_abi;
        const pointer = ctypes.voidptr_t;
        const dictionaryGet = cf.declare("CFDictionaryGetValue", abi, pointer, pointer, pointer);
        const arrayCount = cf.declare("CFArrayGetCount", abi, ctypes.long, pointer);
        const arrayGet = cf.declare("CFArrayGetValueAtIndex", abi, pointer, pointer, ctypes.long);
        const numberGet = cf.declare("CFNumberGetValue", abi, ctypes.bool, pointer, ctypes.int, pointer);
        const stringGet = cf.declare(
            "CFStringGetCString",
            abi,
            ctypes.bool,
            pointer,
            ctypes.char.ptr,
            ctypes.long,
            ctypes.uint32_t,
        );
        const copyWindows = cg.declare("CGWindowListCopyWindowInfo", abi, pointer, ctypes.uint32_t, ctypes.uint32_t);
        const point = ctypes.StructType("CGPoint", [{ x: ctypes.double }, { y: ctypes.double }]);
        const size = ctypes.StructType("CGSize", [{ width: ctypes.double }, { height: ctypes.double }]);
        const rect = ctypes.StructType("CGRect", [{ origin: point }, { size }]);
        const getBounds = cg.declare("CGRectMakeWithDictionaryRepresentation", abi, ctypes.bool, pointer, rect.ptr);
        const createEvent = cg.declare("CGEventCreate", abi, pointer, pointer);
        const getLocation = cg.declare("CGEventGetLocation", abi, point, pointer);
        const release = cf.declare("CFRelease", abi, ctypes.void_t, pointer);
        const mouseEvent = createEvent(pointer(0));
        if (mouseEvent.isNull()) return false;
        let location;
        try {
            location = getLocation(mouseEvent);
        } finally {
            release(mouseEvent);
        }
        const { x, y } = location;
        const key = (name: string) => cg.declare(name, pointer);
        const layerKey = key("kCGWindowLayer");
        const boundsKey = key("kCGWindowBounds");
        const ownerKey = key("kCGWindowOwnerName");

        // On-screen windows are ordered front to back; no titles or screen pixels
        // are read. Ignore overlay windows, including the native drag image.
        windows = copyWindows(1 | 16, 0);
        if (windows.isNull()) {
            return false;
        }
        const count = Number(arrayCount(windows).toString());
        for (let index = 0; index < count; index++) {
            const windowInfo = arrayGet(windows, index);
            const layer = ctypes.int32_t();
            const layerValue = dictionaryGet(windowInfo, layerKey);
            if (layerValue.isNull() || !numberGet(layerValue, 3, layer.address()) || layer.value !== 0) {
                continue;
            }
            const bounds = rect();
            const boundsValue = dictionaryGet(windowInfo, boundsKey);
            if (boundsValue.isNull() || !getBounds(boundsValue, bounds.address())) {
                continue;
            }
            const origin = bounds.origin;
            if (
                x < origin.x ||
                y < origin.y ||
                x >= origin.x + bounds.size.width ||
                y >= origin.y + bounds.size.height
            ) {
                continue;
            }
            const owner = ctypes.char.array(256)();
            const ownerValue = dictionaryGet(windowInfo, ownerKey);
            return (
                !ownerValue.isNull() &&
                stringGet(ownerValue, owner, owner.length, 0x08000100) &&
                owner.readString() === "Microsoft Word"
            );
        }
        return false;
    } finally {
        if (windows && !windows.isNull()) {
            cf.declare("CFRelease", ctypes.default_abi, ctypes.void_t, ctypes.voidptr_t)(windows);
        }
        cg?.close();
        cf.close();
    }
}

export function isWordDropTarget(): boolean {
    try {
        let ctypes: any;
        try {
            ctypes = (ChromeUtils as any).importESModule("resource://gre/modules/ctypes.sys.mjs").ctypes;
        } catch {
            // Zotero 7 uses Firefox 115, where ctypes has not migrated to ESM.
            ctypes = (ChromeUtils as any).import("resource://gre/modules/ctypes.jsm").ctypes;
        }
        if (Zotero.isWin) {
            return isWindowsWordTarget(ctypes);
        }
        if (Zotero.isMac) {
            // Read coordinates in the same Quartz space as the window bounds.
            // Gecko dragend screen coordinates vary on scaled/multiple displays.
            return isMacWordTarget(ctypes);
        }
    } catch (error) {
        Zotero.logError(error instanceof Error ? error : new Error(String(error)));
    }
    return false;
}
