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
        const citation = ztoolkit.ExtraField.getExtraField(item, "citation") as string
        if (citation) {
          let data: CitationData = {}
          try {
            data = JSON.parse(citation) as CitationData
          } catch {}
          console.log(data)
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