import { config } from "../package.json";
import { getString, initLocale } from "./modules/locale";
import Citation from "./modules/citation";
import { citeFromSelectedItems } from "./modules/cite";
import Views from "./modules/views";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  initLocale();
  ztoolkit.UI.basicOptions.ui.enableElementRecord = false
  ztoolkit.UI.basicOptions.ui.enableElementJSONLog = false

  const citation = new Citation()
  citation.listener(1000);

  const views = new Views()
  await views.createCitationColumn();
  // 注册命令
  ztoolkit.Prompt.register([
    {
      name: "引用",
      label: "Citation",
      when: () => {
        return (
          ZoteroPane.getSelectedItems().length > 0 &&
          Zotero.Integration?.currentSession?.agent
        )
      },
      callback: () => {
        citeFromSelectedItems()
      }
    }
  ])

  // 注册快捷键
  
  ztoolkit.Shortcut.register("event", {
    id: "citation-cite-key",
    key: "'",
    callback: citeFromSelectedItems
  })
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  console.log("Prompt unregisterAll")
  ztoolkit.Prompt.unregisterAll();
  // Remove addon object
  addon.data.alive = false;
  delete Zotero.ZoteroCitation;
}


export default {
  onStartup,
  onShutdown,
};
