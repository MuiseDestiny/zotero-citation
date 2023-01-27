export default class Citation {
	public session: { [key: string]: { search: any, itemIDs: number[] } } = {}
	public intervalID!: number
	// public names = new Set();
	constructor() {
	}

	/**
	 * 监听session状态以生成搜索目录
	 */
	public listener(t: number) {
		this.intervalID = window.setInterval(async () => {
			if (!Zotero.ZoteroCitation) { this.clear() }
			for (let sessionID in Zotero.Integration.sessions) {
				let sessionData = Zotero.Integration.sessions[sessionID]
				if (!(sessionData.agent as string).includes("Word")) { continue }
				if (sessionID in this.session == false) {
					this.session[sessionID] = { search: undefined, itemIDs: [] }
				}

				let itemIDs = Object.keys(sessionData.citationsByItemID).map(Number) as number[]
				this.markItems(sessionID, itemIDs)
				this.session[sessionID].itemIDs = itemIDs

				if (!this.session[sessionID].search) {
					this.session[sessionID].search = true
					// @ts-ignore
					await this.saveSearch(sessionID)
				} else {
					// if (this.names.size > 0) {
					// 	const search = this.session[sessionID].search
					// 	search.name = `[Citation] ${[...this.names][0]}`
					// 	await search.saveTx()
					// }
				}
			}
		}, t)
		window.addEventListener("close", (event) => {
			event.preventDefault()
			try {
				this.clear()
			} catch {}
			window.setTimeout(() => {
				window.close()
			})
		})
		// let execCommand = Zotero.Integration.execCommand
		// Zotero.Integration.execCommand = async (agent: string, cmd: string, document: string, templateVersion: any) => {
		// 	ztoolkit.log(agent, cmd, document, templateVersion)
		// 	if (agent.includes("Word")) {
		// 		this.names.add(document)
		// 	}
		// 	execCommand(agent, cmd, document, templateVersion)
		// };
	}

	public markItems(sessionID: string, itemIDs: number[]) {
		itemIDs.forEach(async (id: number) => {
			const item = Zotero.Items.get(id)
			if (this.session[sessionID].itemIDs.indexOf(id) == -1) {
				await ztoolkit.ExtraField.setExtraField(item, "citation", String(sessionID))
			}
		})
		this.session[sessionID].itemIDs.forEach(async (id: number) => {
			const item = Zotero.Items.get(id)
			if (itemIDs.indexOf(id) == -1) {
				await ztoolkit.ExtraField.setExtraField(item, "citation", "")
			}
		})
	}

	public async saveSearch(sessionID: string) {
		// @ts-ignore
		let s = new Zotero.Search();
		s.addCondition("extra", "contains", `citation: ${sessionID}`);
		await s.search();
		s.libraryID = 1
		s.name = `[Citation] ${sessionID}`
		s = s.clone()
		ztoolkit.log("Save search")
		await s.saveTx()
		this.session[sessionID].search = s

	}

	/**
	 * 退出时调用
	 */
	public clear() {
		window.clearInterval(this.intervalID)
		Object.keys(this.session).forEach(async (sessionID: string) => {
			// @ts-ignore
			await this.session[sessionID].search.eraseTx()
		})
	}
}