import { config } from "../../package.json";

export default class Citation {
	public session: { [key: string]: { search: any, itemIDs: number[]; pending: boolean} } = {}
	public intervalID!: number
	private prefix: string;
	constructor() {
		this.prefix = Zotero.Prefs.get(`${config.addonRef}.prefix`) as string
	}

	/**
	 * 监听session状态以生成搜索目录
	 */
	public listener(t: number) {
		this.intervalID = window.setInterval(async () => {
			if (!Zotero.ZoteroCitation) { this.clear() }
			for (let sessionID in Zotero.Integration.sessions) {
				let session = Zotero.Integration.sessions[sessionID]
				if (!(session.agent as string).includes("Word")) { continue }
				if (sessionID in this.session == false) {
					this.session[sessionID] = { search: undefined, itemIDs: [], pending: false}
				}

				let itemIDs = session.getItems().map((i: _ZoteroTypes.Zotero)=>Number(i.id)) as number[]
				this.markItems(sessionID, itemIDs)
				this.session[sessionID].itemIDs = itemIDs

				if (!this.session[sessionID].search && !this.session[sessionID].pending && itemIDs.length > 0) {
					this.session[sessionID].pending = true
					let id = ZoteroPane.collectionsView.getSelectedCollection()?.id
					// @ts-ignore
					await this.saveSearch(sessionID)
					id && ZoteroPane.collectionsView.selectCollection(id)
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
		const execCommand = Zotero.Integration.execCommand
		let session = this.session
		// @ts-ignore
		const OS = window.OS
		// @ts-ignore
		Zotero.Integration.execCommand = async function (agent, command, docId) {
			console.log(...arguments)
			await execCommand(...arguments);
			let id = window.setInterval(async () => {
				const sessionID = Zotero.Integration?.currentSession?.sessionID
				if (!sessionID || !session[sessionID]) { return }
				let _session = session[sessionID]
				while (!_session.search) {await Zotero.Promise.delay(10)}
				if (_session.search.name.includes(sessionID)) {
					_session.search.name = _session.search.name.replace(sessionID, OS.Path.basename(docId))
					await _session.search.saveTx()
				}
				window.clearInterval(id)
			})
		}
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
		let s = new Zotero.Search();
		s.addCondition("extra", "contains", `citation: ${sessionID}`);
		await s.search();
		s.name = `${this.prefix}${sessionID}`
		s = s.clone(1)
		ztoolkit.log("Save search")
		await s.saveTx()
		this.session[sessionID].search = s
		this.session[sessionID].pending = false
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