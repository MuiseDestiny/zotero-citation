import { initLocale, getString } from "./locale"

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
}


export default Views