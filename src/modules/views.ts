import { initLocale, getString } from "./locale"
import { config } from "../../package.json";

class Views {
  constructor() {
    initLocale()
  }

  public async createCitationColumn() {
    const key = "citation"
    await ztoolkit.ItemTree.register(
      key,
      getString("column.citation"),
      (
        field: string,
        unformatted: boolean,
        includeBaseMapped: boolean,
        item: Zotero.Item
      ) => {
        let currentSession = Zotero.Integration.currentSession
        if (!currentSession) { return "" }
        const search = (
          ZoteroPane.collectionsView.getSelectedSearch() ||
          Zotero.ZoteroCitation.api.sessions[currentSession.sessionID].search
        )
        if (!search) { return "" }
        const data = Zotero.ZoteroCitation.api.cache[item.id] as CitationData
        if (data) { 
          return (data[search.key] && data[search.key]?.plainCitation) || ""
        } else {
          return ""
        }
      },
      {
        renderCellHook(index, data, column) {
          const div = document.querySelector(`#item-tree-main-default-row-${index}`) as HTMLDivElement
          if (div && div.getAttribute("_dragend") != "true") {
            div.addEventListener('dragend', (event) => {
              // 只有把条目拖离Zotero界面，才会触发
              const docRect = document.documentElement.getBoundingClientRect()
              const winRect = { left: window.screenX, top: window.screenY, width: docRect.width, height: docRect.height}
              const left = event.screenX, top = event.screenY
              if (
                left > winRect.left && left < winRect.left + winRect.width &&
                top > winRect.top && left < winRect.top + winRect.height
              ) { return }
              Zotero[config.addonInstance].api.citeFromSelectedItems()
            }, { passive: true });
            div.setAttribute("_dragend", "true")
          }
          const span = ztoolkit.UI.createElement(document, "span") as HTMLSpanElement
          if (data == "") {
            return span
          } else {
            span.innerText = data.replace(/\d+:\s*/, "")
            return span;
          }
        },
      }
    )
  }

  public async dragCite() {
    ztoolkit.patch(ZoteroPane.itemsView, "onDragStart", config.addonRef,
      (original)=> async (event: any, row: number) => {
        await original(event, row)
        // 此处必须有一个空格，不然插入的光标移动是无效的
        event.dataTransfer.setData("text/plain", " ")
        event.dataTransfer.setData("text/html", " ")
      }
    )
  }
}


export default Views