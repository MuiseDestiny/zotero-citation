import { config } from "../package.json";
import { initLocale } from "./modules/locale";
import Citation from "./modules/citation";
import { citeItems, waitForCiteItems } from "./modules/cite";
import Views from "./modules/views";

const keydownHandler = (event: any) => {
    if (event.key === "'" && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const target = event.originalTarget || event.target;
        if (target?.isContentEditable || (target && "value" in target)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        void citeItems().catch((error) => Zotero.logError(error));
    }
};

async function onStartup() {
    await Promise.all([Zotero.initializationPromise, Zotero.unlockPromise, Zotero.uiReadyPromise]);
    if (!addon.data.alive) return;
    initLocale();

    const citation = new Citation();
    addon.data.citation = citation;
    await citation.listener(1000);
    if (!addon.data.alive) return;

    const views = new Views();
    addon.data.views = views;
    await views.patchIcon();
    await views.createCitationColumn();
    await views.dragCite();

    document.addEventListener("keydown", keydownHandler, true);
}

async function onShutdown(): Promise<void> {
    addon.data.alive = false;
    try {
        await addon.data.startupPromise;
        document.removeEventListener("keydown", keydownHandler, true);
        await waitForCiteItems();
        await addon.data.citation?.clear();
    } catch (error) {
        Zotero.logError(error instanceof Error ? error : new Error(String(error)));
    } finally {
        try {
            await addon.data.views?.clear();
        } catch (error) {
            Zotero.logError(error instanceof Error ? error : new Error(String(error)));
        } finally {
            addon.data.views = undefined;
            addon.data.citation = undefined;
            addon.data.alive = false;
            delete Zotero[config.addonInstance];
        }
    }
}

export default {
    onStartup,
    onShutdown,
};
