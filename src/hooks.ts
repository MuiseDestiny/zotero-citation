import { config } from "../package.json";
import { getString, initLocale } from "./modules/locale";
import Citation from "./modules/citation";
import { citeItems } from "./modules/cite";
import Views from "./modules/views";

const keydownHandler = (event: any) => {
    if (event.key.toLowerCase() == "'") {
        ztoolkit.log(event);
        if (event.originalTarget.isContentEditable || "value" in event.originalTarget) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        void citeItems().catch((error) => Zotero.logError(error));
    }
};

async function onStartup() {
    await Promise.all([Zotero.initializationPromise, Zotero.unlockPromise, Zotero.uiReadyPromise]);
    initLocale();

    const citation = new Citation();
    addon.data.citation = citation;
    await citation.listener(1000);

    const views = new Views();
    await views.patchIcon();
    await views.createCitationColumn();
    await views.dragCite();

    document.addEventListener("keydown", keydownHandler, true);
}

async function onShutdown(): Promise<void> {
    try {
        document.removeEventListener("keydown", keydownHandler, true);
        await addon.data.citation?.clear();
    } catch (error) {
        Zotero.logError(error instanceof Error ? error : new Error(String(error)));
    } finally {
        addon.data.citation = undefined;
        ztoolkit.unregisterAll();
        ztoolkit.Prompt.unregisterAll();
        // Remove addon object
        addon.data.alive = false;
        delete Zotero[config.addonInstance];
    }
}

export default {
    onStartup,
    onShutdown,
};
