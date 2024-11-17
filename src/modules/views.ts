import { initLocale, getString } from "./locale";
import { config } from "../../package.json";

class Views {
  constructor() {
    initLocale();
  }

  public async createCitationColumn() {
    const key = "citation";
    await Zotero.ItemTreeManager.registerColumns({
      dataKey: key,
      label: getString(`column-${key}`),
      zoteroPersist: ['width', 'hidden', 'sortDirection'],
      dataProvider: (
        item: Zotero.Item, dataKey: string
      ) => {
        try {
          const currentSession = Zotero.Integration.currentSession;
          if (!currentSession) {
            return "";
          }
          const search =
            ZoteroPane.collectionsView.getSelectedSearch() ||
            Zotero.ZoteroCitation.api.sessions[currentSession.sessionID].search;
          if (!search) {
            return "";
          }
          const session = Object.values(Zotero.ZoteroCitation.api.sessions).find(
            (session: any) => session.search.key == search.key,
          ) as SessionData;
          if (session) {
            return session.idData[item.id].plainCitation;
          }
          return ""
        } catch {
          return "";
        }
      },
      renderCell: (index, data, column) => {
        const span = ztoolkit.UI.createElement(document, "span") as HTMLSpanElement
        span.style.pointerEvents = "auto"
        if (!column) { return span }
        span.className = `cell ${column.className}`;
        const div = document.querySelector(`#item-tree-main-default-row-${index}`) as HTMLDivElement;
        if (div && div.getAttribute("_dragend") != "true") {
          div.addEventListener(
            "dragend",
            (event) => {
              const items = ZoteroPane.getSelectedItems();
              if (items.find(i=>!i.isTopLevelItem())) { return }
              // 只有把条目拖离Zotero界面，才会触发
              const docRect = document.documentElement.getBoundingClientRect();
              const winRect = {
                left: window.screenX,
                top: window.screenY,
                width: docRect.width,
                height: docRect.height,
              };
              const left = event.screenX;
              const top = event.screenY;
              if (
                left > winRect.left &&
                left < (winRect.left + winRect.width) &&
                top > winRect.top &&
                top < (winRect.top + winRect.height)
              ) {
                return;
              }
              ztoolkit.log("_dragend", event)
              addon.api.citeItems();
            },
            { passive: true },
          );
          div.setAttribute("_dragend", "true");
        }
        if (data == "") {
          return span;
        } else {
          span.innerText = data?.replace(/\d+:\s*/, "");
          return span;
        }
      },
      pluginID: config.addonID,
    });
  }

  public async dragCite() {
    ztoolkit.patch(
      ZoteroPane.itemsView,
      "onDragStart",
      config.addonRef,
      (original: any) => async (event: any, row: number) => {
        event.dataTransfer.setData("text/plain", "");
      },
    );
  }

  public async patchIcon() {
    try {
      ztoolkit.patch(
        ZoteroPane.collectionsView,
        "renderItem",
        config.addonRef,
        (original) => (index: number, selection: object, oldDiv: HTMLDivElement, columns: any[]) => {
          const div = original.call(ZoteroPane.collectionsView, index, selection, oldDiv, columns);
          const row = ZoteroPane.collectionsView.getRow(index) as any;
          if (
            Object.values(Zotero.ZoteroCitation.api.sessions)
              .map((s: any) => s.search?.key)
              .indexOf(row?.ref?.key) != -1
          ) {
            const iconNode = div.querySelector(".cell-icon") as HTMLDivElement;
            iconNode.style.backgroundImage = `url(chrome://${config.addonRef}/content/icons/word.png)`;
            iconNode.classList.remove("icon-search")
            iconNode.classList.add("icon-publications")
          }
          return div;
        },
      );
    } catch {
      /* empty */
    }
  }
}

export default Views;
