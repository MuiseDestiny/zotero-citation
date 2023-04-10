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
        try {
          let currentSession = Zotero.Integration.currentSession
          if (!currentSession) { return "" }
          const search = (
            ZoteroPane.collectionsView.getSelectedSearch() ||
            Zotero.ZoteroCitation.api.sessions[currentSession.sessionID].search
          )
          if (!search) { return "" }
          const session = Object.values(Zotero.ZoteroCitation.api.sessions)
            .find((session: any) => session.search.key == search.key) as SessionData
          if (session) {
            return session.idData[item.id].plainCitation
          }
        } catch {
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
              Zotero[config.addonInstance].api.citeItems()
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

  public async patchIcon() {
    try {
      ztoolkit.patch(
        ZoteroPane.collectionsView,
        "renderItem",
        config.addonRef,
        (original) =>
          (index: number, selection: object, oldDiv: HTMLDivElement, columns: any[]) => {
            const div = original.call(ZoteroPane.collectionsView, index, selection, oldDiv, columns)

            const row = ZoteroPane.collectionsView.getRow(index) as any
            if (
              Object.values(Zotero.ZoteroCitation.api.sessions)
                .map((s: any) => s.search?.key).indexOf(row?.ref?.key) != -1
            ) {
              const iconNode = div.querySelector(".cell-icon")
              iconNode.style.backgroundImage = `url(chrome://${config.addonRef}/content/icons/word.png)`
            }
            return div
          }
      )
    } catch {}
  }
}


export default Views