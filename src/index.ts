import Addon from "./addon";
import { config } from "../package.json";

const zotero = _globalThis.Zotero;
if (!zotero[config.addonInstance]) {
    const mainWindow = zotero.getMainWindow() as any;
    // Set global variables
    _globalThis.Zotero = zotero;
    _globalThis.ZoteroPane = mainWindow.ZoteroPane;
    _globalThis.Zotero_Tabs = mainWindow.Zotero_Tabs;
    _globalThis.window = mainWindow;
    _globalThis.document = mainWindow.document;
    _globalThis.console = mainWindow.console;
    _globalThis.addon = new Addon();
    Zotero[config.addonInstance] = addon;
    // Trigger addon hook for initialization
    addon.data.startupPromise = addon.hooks.onStartup().catch((error) => Zotero.logError(error));
}
