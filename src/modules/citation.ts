import { config } from "../../package.json";

export default class Citation {
	public sessions: { [sessionID: string]: SessionData } = {}
	public intervalID!: number
	private prefix: string;
	private filterFunctions: Function[] = [];
	constructor() {
		this.prefix = Zotero.Prefs.get(`${config.addonRef}.prefix`) as string
		Zotero.ZoteroCitation.api.sessions = this.sessions
		// Zotero.ZoteroCitation.api.cache = this.cache
		const filterFunctions = this.filterFunctions
		try {
			ztoolkit.patch(
				Zotero.CollectionTreeRow.prototype, "getItems", config.addonRef,
				(original) =>
					async function () {
						// @ts-ignore
						let items = await original.call(this);
						for (let i = 0; i < filterFunctions.length; i++) {
							items = filterFunctions[i](items)
						}
						return items
					}
			)
		} catch {}
	}

	/**
	 * 删除历史清除失效的文件夹
	 */
	public async clearSearch() {
		let i = 0;
		while (true) {
			let row = ZoteroPane.collectionsView.getRow(i) as any
			if (!row) { break}
			if (row?.ref?._ObjectType == "Search") {
				const conditions = row.ref.getConditions()
				if (Object.values(conditions).length == 1) {
					const condition = conditions[0]
					if (condition.condition == "title" && condition.value == "") {
						const search = row.ref
						if (Object.values(this.sessions).map((s: SessionData) => s.search?.key).indexOf(search.key) == -1) {
							await search.eraseTx()
							console.log("delete", search.name)
							i -= 1
						}
					}
				}
			}
			i += 1
		}
	}

	/**
	 * 监听session状态以生成搜索目录
	 */
	public async listener(t: number) {
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
					_sessions[sessionID] = _session = { search: undefined, idData: {}, pending: true } as SessionData
					await this.initSearch(sessionID)
					_session.pending = false
				}
				// 其它线程search正在创建，则退出本次执行
				if (_session.pending == true && !_session.search) { return }
				let citationsByItemID = session.citationsByItemID
				// 分析排序
				let sortedItemIDs = this.getSortedItemIDs(session.citationsByIndex)
				this.updateCitations(sessionID, citationsByItemID, sortedItemIDs)
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

	public updateCitations(sessionID: string, citationsByItemID: { [id: string]: any[] }, sortedItemIDs: number[]) {
		// 数据是否有变动
		let getPlainCitation = (id: string) => sortedItemIDs.indexOf(Number(id)) + ": " + citationsByItemID[id].map(i => i.properties.plainCitation).join(", ")
		// 待更新新数据
		const targetData: any = {}
		for (let id of Object.keys(citationsByItemID)) {
			targetData[id] = { plainCitation: getPlainCitation(id) }
		}
		// 与旧数据比较
		if (JSON.stringify(targetData) == JSON.stringify(this.sessions[sessionID].idData)) {
			return
		} else {
			this.sessions[sessionID].idData = targetData
			ZoteroPane.itemsView.refreshAndMaintainSelection()
		}
	}

	public async initSearch(sessionID: string) {
		let search = new Zotero.Search();
		search.addCondition("title", "contains", "");
		await search.search();
		search.name = `${this.prefix}${sessionID}`
		const session: SessionData =  this.sessions[sessionID]
		session.search = search = search.clone(1)
		await search.saveTx({ skipSelect: true })
		this.filterFunctions.push(
			(items: Zotero.Item[]) => {
				// 当前处在伪搜索文件夹中才进行拦截
				let selectedSearch = ZoteroPane.collectionsView.getSelectedSearch()
				if (selectedSearch.key == search.key) {
					const ids = Object.keys(session.idData).map(id => Number(id))
					return items.filter(item=>ids.indexOf(item.id) != -1)
				} else {
					return items
				}
			}	
		)
		window.setTimeout(async () => {
			await this.clearSearch()
		})
	}

	/**
	 * 退出时调用
	 */
	public clear() {
		window.clearInterval(this.intervalID)
		Object.values(this.sessions).forEach(async (session: SessionData) => {
			// @ts-ignore
			await session.search.eraseTx()
		})
	}
}