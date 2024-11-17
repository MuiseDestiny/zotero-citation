import { config } from "../package.json";
import { getString, initLocale } from "./modules/locale";
import Citation from "./modules/citation";
import { citeItems } from "./modules/cite";
import Views from "./modules/views";

async function onStartup() {
    await Promise.all([Zotero.initializationPromise, Zotero.unlockPromise, Zotero.uiReadyPromise]);
    initLocale();

    const citation = new Citation();
    await citation.listener(1000);

    const views = new Views();
    await views.patchIcon();
    await views.createCitationColumn();
    await views.dragCite();

    document.addEventListener(
        "keydown",
        (event: any) => {
            if (event.key.toLowerCase() == "'") {
                if (event.originalTarget.isContentEditable || "value" in event.originalTarget) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                citeItems();
            }
        },
        true,
    );
}

function onShutdown(): void {
    ztoolkit.unregisterAll();
    ztoolkit.Prompt.unregisterAll();
    // Remove addon object
    addon.data.alive = false;
    delete Zotero[config.addonInstance];
}

export default {
    onStartup,
    onShutdown,
};
