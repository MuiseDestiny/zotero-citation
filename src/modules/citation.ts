import { config } from "../../package.json";

export default class Citation {
	public sessions: { [sessionID: string]: { search: any, itemIDs: number[]; pending: boolean, lastName?: string } } = {}
	public intervalID!: number
	private prefix: string;
	private cache: { [id: string]: CitationData } = {};
	constructor() {
		this.prefix = Zotero.Prefs.get(`${config.addonRef}.prefix`) as string || "[Citation]"
		Zotero.ZoteroCitation.api.sessions = this.sessions
		Zotero.ZoteroCitation.api.cache = this.cache
	}

	/**
	 * 监听session状态以生成搜索目录
	 */
	public listener(t: number) {
		let isExecCommand = false
		this.intervalID = window.setInterval(async () => {
			if (!Zotero.ZoteroCitation) { return this.clear() }
			if (!Zotero.Integration.currentSession || isExecCommand) { return }
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
		const prefix = this.prefix
		// @ts-ignore
		const OS = window.OS
		// @ts-ignore
		Zotero.Integration.execCommand = async function (agent, command, docId) {
			console.log(...arguments)
			isExecCommand = true
			await execCommand(...arguments);
			isExecCommand = false
			if (docId.endsWith("__doc__")) { return }
			let id = window.setInterval(async () => {
				const sessionID = Zotero.Integration?.currentSession?.sessionID
				if (!sessionID || !_sessions[sessionID]) { return }
				let _session = _sessions[sessionID]
				window.clearInterval(id)
				while (!_session.search) {await Zotero.Promise.delay(10)}
				if (
					_session.search.name.endsWith(sessionID) ||
					_session.search.name.endsWith(_session.lastName)
				) {
					_session.search.name = _session.lastName = prefix + OS.Path.basename(docId)
					await _session.search.saveTx({ skipSelect: true })
					ZoteroPane.collectionsView.refresh()
				}
			}, 0)
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
		return SortedItemIDs
	}

	public markItems(sessionID: string, citationsByItemID: { [id: string]: any[] }, sortedItemIDs: number[]) {
		let getExtraField = (item: Zotero.Item, key: string, defaultValue: any = []) => {
			let data: any
			try {
				data = JSON.parse(
					ztoolkit.ExtraField.getExtraField(item, key) as string
				) as string[]
			} catch {
				data = defaultValue
			}
			return data
		} 
		const searchKey = this.sessions[sessionID].search.key
		let isUpdate = false
		Object.keys(citationsByItemID).forEach(async (key: string) => {
			let id = Number(key)
			const item = Zotero.Items.get(id)
			if (!citationsByItemID[id] || !item) { return }
			const data: CitationData = (this.cache[id] ??= {})
			const info = {
				sessionID: sessionID,
				plainCitation: sortedItemIDs.indexOf(id) + ": " + citationsByItemID[id].map(i=>i.properties.plainCitation).join(", ")
			}
			if (JSON.stringify(data[searchKey]) == JSON.stringify(info)) { return }
			data[searchKey] = info
			isUpdate = true
			let extraSessionIDs = getExtraField(item, "sessionIDs")
			if (extraSessionIDs.indexOf(sessionID) == -1) {
				extraSessionIDs.push(sessionID)
			}
			// 数据清理
			extraSessionIDs = extraSessionIDs.filter((id: string) => Object.keys(this.sessions).indexOf(id) != -1)
			const _extraSessionIDs: string = JSON.stringify(extraSessionIDs)
			if (_extraSessionIDs != ztoolkit.ExtraField.getExtraField(item, "sessionIDs")) {
				await ztoolkit.ExtraField.setExtraField(item, "sessionIDs", _extraSessionIDs)
			}
		})
		if (isUpdate) { ztoolkit.ItemTree.refresh() }
		// 这里不需要手动更新，Zotero的搜索结果自动更新
		this.sessions[sessionID].itemIDs.forEach(async (id: number) => {
			if (Object.keys(citationsByItemID).indexOf(String(id)) == -1) {
				const item = Zotero.Items.get(id)
				if (!item) { return }
				delete this.cache[id]
				let extraSessionID = getExtraField(item, "sessionIDs")
				extraSessionID = extraSessionID.filter((id: string) => id != sessionID)
				await ztoolkit.ExtraField.setExtraField(item, "sessionIDs", JSON.stringify(extraSessionID))
			}
		})
	}

	public async saveSearch(sessionID: string) {
		let s = new Zotero.Search();
		s.addCondition("extra", "contains", sessionID);
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
				await ztoolkit.ExtraField.setExtraField(item, "sessionIDs", "")
			})
		})
	}
}