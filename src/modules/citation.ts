import { config } from "../../package.json";

export default class Citation {
	public sessions: { [sessionID: string]: { search: any, itemIDs: number[]; pending: boolean} } = {}
	public intervalID!: number
	private prefix: string;
	constructor() {
		this.prefix = Zotero.Prefs.get(`${config.addonRef}.prefix`) as string
		Zotero.ZoteroCitation.api.sessions = this.sessions
	}

	/**
	 * 监听session状态以生成搜索目录
	 */
	public listener(t: number) {
		this.intervalID = window.setInterval(async () => {
			if (!Zotero.ZoteroCitation) { return this.clear() }
			if (!Zotero.Integration.currentSession) { return }
			let sessions = Zotero.Integration.sessions
			let _sessions = this.sessions
			for (let sessionID in sessions) {
				let session = sessions[sessionID], _session
				if (!(session.agent as string).includes("Word")) { continue }
				// 初始化对象的session
				if (sessionID in _sessions) {
					_session = _sessions[sessionID]
				} else {
					_sessions[sessionID] = _session = { search: undefined, itemIDs: [], pending: true } as SessionData
					await this.saveSearch(sessionID)
					_session.pending = false
				}
				// 其它线程等待search创建
				while (_session.pending == true && !_session.search) {
					await Zotero.Promise.delay(10)
				}
				// search初始化完毕
				let citationsByItemID = session.citationsByItemID
				// 分析排序
				let sortedItemIDs = this.getSortedItemIDs(session.citationsByIndex)
				this.markItems(sessionID, citationsByItemID, sortedItemIDs)
				_session.itemIDs = session.getItems().map((item: Zotero.Item)=>item.id)
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
		let _sessions = this.sessions
		// @ts-ignore
		const OS = window.OS
		// @ts-ignore
		Zotero.Integration.execCommand = async function (agent, command, docId) {
			console.log(...arguments)
			await execCommand(...arguments);
			let id = window.setInterval(async () => {
				const sessionID = Zotero.Integration?.currentSession?.sessionID
				if (!sessionID || !_sessions[sessionID]) { return }
				let _session = _sessions[sessionID]
				while (!_session.search) {await Zotero.Promise.delay(10)}
				if (_session.search.name.includes(sessionID)) {
					_session.search.name = _session.search.name.replace(sessionID, OS.Path.basename(docId))
					await _session.search.saveTx()
				}
				window.clearInterval(id)
			})
		}
	}
	public getSortedItemIDs(citationsByIndex: any) {
		let SortedItemIDs: number[] = [];
		for (let i in citationsByIndex) {
			citationsByIndex[i].citationItems.forEach((item: {id: number}) => {
				if (SortedItemIDs.indexOf(item.id) == -1) {
					SortedItemIDs.push(item.id)
				}
			})
		}
		console.log(SortedItemIDs)
		return SortedItemIDs

	}
	public markItems(sessionID: string, citationsByItemID: { [id: string]: any[] }, sortedItemIDs: number[]) {
		const searchKey = this.sessions[sessionID].search.key
		Object.keys(citationsByItemID).forEach(async (key: string) => {
			let id = Number(key)
			// if (this.sessions[sessionID].itemIDs.indexOf(id) == -1) {
			const item = Zotero.Items.get(id)
			let data: CitationData = {}
			const citationString = ztoolkit.ExtraField.getExtraField(item, "citation") as string
			try {
				data = JSON.parse(citationString)
			} catch { }
			data[searchKey] = {
				sessionID: sessionID,
				plainCitation: sortedItemIDs.indexOf(id) + ": " + citationsByItemID[id].map(i=>i.properties.plainCitation).join(", ")
			}
			// 冗余清理
			const searchKeys = Object.values(this.sessions).map((session: SessionData) => session.search?.key)
			const dataKeys = Object.keys(data)
			for (let i = 0; i < dataKeys.length; i++) {
				let dataKey = dataKeys[i]
				if (searchKeys.indexOf(dataKey) == -1) {
					delete data[dataKey]
				}
			}
			if (citationString != JSON.stringify(data)) {
				await ztoolkit.ExtraField.setExtraField(item, "citation", JSON.stringify(data))
			}
			// }
		})
		this.sessions[sessionID].itemIDs.forEach(async (id: number) => {
			if (Object.keys(citationsByItemID).indexOf(String(id)) == -1) {
				const item = Zotero.Items.get(id)
				await ztoolkit.ExtraField.setExtraField(item, "citation", "")
			}
		})
	}

	public async saveSearch(sessionID: string) {
		let s = new Zotero.Search();
		s.addCondition("extra", "contains", `"sessionID":"${sessionID}"`);
		await s.search();
		s.name = `${this.prefix}${sessionID}`
		s = s.clone(1)
		await s.saveTx({ skipSelect: true})
		this.sessions[sessionID].search = s
	}

	/**
	 * 退出时调用
	 */
	public clear() {
		window.clearInterval(this.intervalID)
		Object.values(this.sessions).forEach(async (session: SessionData) => {
			// @ts-ignore
			await session.search.eraseTx()
			session.itemIDs.forEach(async (id: number) => {
				const item = Zotero.Items.get(id)
				await ztoolkit.ExtraField.setExtraField(item, "citation", "")
			})
		})
	}
}