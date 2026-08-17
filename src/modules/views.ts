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
          const collectionsView = ZoteroPane.collectionsView as any;
          const selectedCollection =
            typeof collectionsView.getSelectedCollections === "function"
              ? (collectionsView.getSelectedCollections() || [])[0]
              : collectionsView.getSelectedCollection?.();
          const selectedSession = selectedCollection
            ? Object.values(Zotero.ZoteroCitation.api.sessions).find(
                (candidate: any) => candidate.collection?.key == selectedCollection.key,
              )
            : undefined;
          const session = (selectedCollection
            ? selectedSession
            : currentSession
              ? Zotero.ZoteroCitation.api.sessions[currentSession.sessionID]
              : undefined) as SessionData | undefined;
          return session?.idData[item.id]?.plainCitation || "";
        } catch {
          return "";
        }
      },
      renderCell: (index, data, column) => {
        ztoolkit.log(index, data, column)
        const span = ztoolkit.UI.createElement(document, "span") as HTMLSpanElement
        span.style.pointerEvents = "auto"
        if (!column) { return span }
        span.className = `cell ${column.className}`;
        const div = (document.querySelector(`#item-tree-main-row-${index}`) ||
          document.querySelector(`#item-tree-main-default-row-${index}`)
      ) as HTMLDivElement;
        
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
              if (!this.getColumnInfo("citation")?.hidden) {
                addon.api.citeItems();
              }
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
    (ztoolkit.patch as any)(
      ZoteroPane.itemsView,
      "onDragStart",
      config.addonRef,
      (original: any) => async (event: any, index: number) => {
        if (!this.getColumnInfo("citation")?.hidden) {
          event.dataTransfer.setData("text/plain", "");
        } else {
          original.bind(ZoteroPane.itemsView)(event, index)
        }
      },
    );
  }

  public async patchIcon() {
    try {
      (ztoolkit.patch as any)(
        ZoteroPane.collectionsView,
        "renderItem",
        config.addonRef,
        (original: any) => (index: number, selection: object, oldDiv: HTMLDivElement, columns: any[]) => {
          const div = (original as any).call(ZoteroPane.collectionsView, index, selection, oldDiv, columns) as HTMLDivElement;
          const row = (ZoteroPane.collectionsView as any).getRow(index) as any;
          if (
            Object.values(Zotero.ZoteroCitation.api.sessions)
              .map((s: any) => s.collection?.key)
              .indexOf(row?.ref?.key) != -1
          ) {
            const iconNode = div.querySelector(".cell-icon") as HTMLDivElement;
            iconNode.style.backgroundImage = `url(chrome://${config.addonRef}/content/icons/word.png)`;
            iconNode.classList.remove("icon-collection", "icon-search")
            iconNode.classList.add("icon-publications")
          }
          return div;
        },
      );
    } catch {
      /* empty */
    }
  }

  private getColumnInfo(dataKey: string) {
    try {
      // @ts-ignore Zotero's internal column registry is not exposed in zotero-types.
      const columnInfo = ZoteroPane.itemsView._columns.find((i: any) => i.dataKey.endsWith(dataKey))
      return columnInfo
    } catch { return {} }
  }
}

export default Views;
