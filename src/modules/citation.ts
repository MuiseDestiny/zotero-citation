import { config } from "../../package.json";

export default class Citation {
    public sessions: { [sessionID: string]: SessionData } = {};
    public intervalID!: number;
    // eslint-disable-next-line @typescript-eslint/ban-types
    private filterFunctions: Function[] = [];
    constructor() {
        Zotero.ZoteroCitation.api.sessions = this.sessions;
        const filterFunctions = this.filterFunctions;
        try {
            ztoolkit.patch(
                Zotero.CollectionTreeRow.prototype,
                "getItems",
                config.addonRef,
                (original) =>
                    async function () {
                        // @ts-ignore ignore
                        let items = await original.call(this);
                        for (let i = 0; i < filterFunctions.length; i++) {
                            items = filterFunctions[i](items);
                        }
                        return items;
                    },
            );
        } catch {
            /* empty */
        }
    }

    /**
     * 删除历史清除失效的文件夹
     */
    public async clearSearch() {
        let i = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const row = ZoteroPane.collectionsView.getRow(i) as any;
            if (!row) {
                break;
            }
            if (row?.ref?._ObjectType == "Search") {
                const conditions = row.ref.getConditions();
                if (Object.values(conditions).length == 1) {
                    const condition = conditions[0];
                    if (condition.condition == "title" && condition.value == "") {
                        const search = row.ref;
                        if (
                            Object.values(this.sessions)
                                .map((s: SessionData) => s.search?.key)
                                .indexOf(search.key) == -1
                        ) {
                            await search.eraseTx();
                            console.log("delete", search.name);
                            i -= 1;
                        }
                    }
                }
            }
            i += 1;
        }
    }

    /**
     * 监听session状态以生成搜索目录
     */
    public async listener(t: number) {
        let isExecCommand = false;
        this.intervalID = window.setInterval(async () => {
            if (!Zotero.ZoteroCitation) {
                return this.clear();
            }
            if (!Zotero.Integration.currentSession || isExecCommand) {
                return;
            }
            const sessions = Zotero.Integration.sessions;
            const _sessions = this.sessions;
            for (const sessionID in sessions) {
                const session = sessions[sessionID];
                let _session: SessionData;
                if (!(session.agent as string).includes("Word")) {
                    continue;
                }
                // 初始化对象的session
                if (sessionID in _sessions) {
                    _session = _sessions[sessionID];
                } else {
                    _sessions[sessionID] = _session = { search: undefined, idData: {}, pending: true } as SessionData;
                    await this.initSearch(sessionID);
                    _session.pending = false;
                }
                // 其它线程search正在创建，则退出本次执行
                if (_session.pending == true && !_session.search) {
                    return;
                }
                const citationsByItemID = session.citationsByItemID;
                // 分析排序
                const sortedItemIDs = this.getSortedItemIDs(session.citationsByIndex);
                this.updateCitations(sessionID, citationsByItemID, sortedItemIDs, session.styleClass);
            }
        }, t);
        window.addEventListener("close", (event) => {
            event.preventDefault();
            try {
                this.clear();
            } catch {
                /* empty */
            }
            window.setTimeout(() => {
                window.close();
            });
        });
        const execCommand = Zotero.Integration.execCommand;
        const _sessions = this.sessions;
        // @ts-ignore ignore
        Zotero.Integration.execCommand = async function (agent, command, docId) {
            // eslint-disable-next-line prefer-rest-params
            console.log(...arguments);
            isExecCommand = true;
            // eslint-disable-next-line prefer-rest-params
            await execCommand(...arguments);
            isExecCommand = false;
            if (docId.endsWith("__doc__")) {
                return;
            }
            const id = window.setInterval(async () => {
                const sessionID = Zotero.Integration?.currentSession?.sessionID;
                if (!sessionID) {
                    console.log("sessionID is null, waiting...");
                    return;
                }
                window.clearInterval(id);
                console.log("clear interval");
                let _session;
                while (!((_session ??= _sessions[sessionID]) && _session.search)) {
                    await Zotero.Promise.delay(10);
                }
                console.log(_sessions);
                // 判断是否为插件修改过的名称，如果是则更新
                // 若为用户更改则不进行更新
                if ([sessionID, _session.lastName].indexOf(_session.search.name) != -1) {
                    let targetName = docId
                    try {
                        targetName = PathUtils.split(docId).slice(-1)[0];
                    } catch { }
                    console.log(`${_session.search.name}->${targetName}`);
                    // 修复Mac储存
                    if (targetName && targetName.trim().length > 0) {
                        _session.search.name = _session.lastName = targetName;
                        await _session.search.saveTx({ skipSelect: true });
                    }
                }
            }, 0);
        };
    }

    public getSortedItemIDs(citationsByIndex: any) {
        const SortedItemIDs: number[] = [];
        for (const i in citationsByIndex) {
            citationsByIndex[i].citationItems.forEach((item: { id: number }) => {
                if (SortedItemIDs.indexOf(item.id) == -1) {
                    SortedItemIDs.push(item.id);
                }
            });
        }
        return SortedItemIDs;
    }

    public updateCitations(sessionID: string, citationsByItemID: { [id: string]: any[] }, sortedItemIDs: number[], styleClass: "in-text" | "note") {
        // 数据是否有变动
        const getPlainCitation = (id: string) =>
            sortedItemIDs.indexOf(Number(id)) +
            ": " +
            citationsByItemID[id].map((i) =>
                // 如果是note类型的style是脚注形式，则直接返回数字
                styleClass == "note" ?
                String(sortedItemIDs.indexOf(Number(id)) + 1)
                :
                i.properties.plainCitation
            ).join(", ");
        // 待更新新数据
        const targetData: any = {};
        for (const id of Object.keys(citationsByItemID)) {
            targetData[id] = { plainCitation: getPlainCitation(id) };
        }
        // 与旧数据比较
        if (JSON.stringify(targetData) == JSON.stringify(this.sessions[sessionID].idData)) {
            return;
        } else {
            this.sessions[sessionID].idData = targetData;
            ZoteroPane.itemsView.refreshAndMaintainSelection();
        }
    }

    public async initSearch(sessionID: string) {
        let search = new Zotero.Search();
        search.addCondition("title", "contains", "");
        await search.search();
        search.name = sessionID;
        const session: SessionData = this.sessions[sessionID];
        session.search = search = search.clone(1);
        await search.saveTx({ skipSelect: true });
        this.filterFunctions.push((items: Zotero.Item[]) => {
            // 当前处在伪搜索文件夹中才进行拦截
            const selectedSearch = ZoteroPane.collectionsView.getSelectedSearch();
            if (selectedSearch.key == search.key) {
                const ids = Object.keys(session.idData).map((id) => Number(id));
                return items.filter((item) => ids.indexOf(item.id) != -1);
            } else {
                return items;
            }
        });
        window.setTimeout(async () => {
            await this.clearSearch();
        }, 233);
    }

    /**
     * 退出时调用
     */
    public clear() {
        window.clearInterval(this.intervalID);
        Object.values(this.sessions).forEach(async (session: SessionData) => {
            // @ts-ignore ignore
            await session.search.eraseTx();
        });
    }
}
