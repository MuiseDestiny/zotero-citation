import { diffItemIDs, isLegacyCitationSearch } from "./citationUtils";

const TEMP_COLLECTION_RELATION = "dc:relation";
const TEMP_COLLECTION_MARKER = "https://github.com/MuiseDestiny/zotero-citation#temporary-collection";
const RENAME_TIMEOUT = 5000;

export default class Citation {
    public sessions: { [sessionID: string]: SessionData } = {};

    private intervalID?: number;
    private pollPromise?: Promise<void>;
    private clearPromise?: Promise<void>;
    private closing = false;
    private execCommandDepth = 0;
    private originalExecCommand?: typeof Zotero.Integration.execCommand;
    private patchedExecCommand?: typeof Zotero.Integration.execCommand;
    private pendingTasks = new Set<Promise<void>>();

    constructor() {
        Zotero.ZoteroCitation.api.sessions = this.sessions;
    }

    /**
     * Remove temporary collections left by an interrupted shutdown and migrate
     * the all-items saved searches created by older versions of the plugin.
     */
    private async clearStaleArtifacts() {
        const libraryID = Zotero.Libraries.userLibraryID;
        const collections = (Zotero.Collections as any).getByLibrary(libraryID, true, true) as Zotero.Collection[];

        for (const collection of collections) {
            try {
                await collection.loadDataType("relations");
                if (collection.getRelationsByPredicate(TEMP_COLLECTION_RELATION).includes(TEMP_COLLECTION_MARKER)) {
                    await collection.eraseTx();
                }
            } catch (error) {
                this.logError("Failed to remove a stale citation collection", error);
            }
        }

        const searches = (Zotero.Searches as any).getByLibrary(libraryID) as Zotero.Search[];
        for (const search of searches) {
            try {
                if (isLegacyCitationSearch(search.getConditions() as any)) {
                    await search.eraseTx();
                }
            } catch (error) {
                this.logError("Failed to remove a legacy citation search", error);
            }
        }
    }

    /**
     * Watch Word integration sessions and keep their temporary collections in sync.
     */
    public async listener(t: number) {
        await this.clearStaleArtifacts();
        this.patchExecCommand();
        window.addEventListener("close", this.handleWindowClose);
        this.intervalID = window.setInterval(() => this.schedulePoll(), t);
        this.schedulePoll();
    }

    private schedulePoll() {
        if (this.closing || this.pollPromise) {
            return;
        }

        const task = this.pollSessions()
            .catch((error) => this.logError("Failed to refresh citation collections", error))
            .finally(() => {
                if (this.pollPromise === task) {
                    this.pollPromise = undefined;
                }
            });
        this.pollPromise = task;
    }

    private async pollSessions() {
        if (this.closing || this.execCommandDepth > 0) {
            return;
        }

        const integrationSessions = Zotero.Integration.sessions;
        const wordSessionIDs = Object.keys(integrationSessions).filter((sessionID) =>
            String(integrationSessions[sessionID].agent).includes("Word"),
        );
        const activeSessionIDs = new Set(wordSessionIDs);

        for (const sessionID of Object.keys(this.sessions)) {
            if (!activeSessionIDs.has(sessionID)) {
                await this.clearSession(sessionID);
            }
        }

        if (this.closing) {
            return;
        }

        for (const sessionID of wordSessionIDs) {
            if (this.closing || this.execCommandDepth > 0) {
                return;
            }

            const integrationSession = integrationSessions[sessionID];
            let session = this.sessions[sessionID];
            if (!session) {
                session = {
                    collection: undefined,
                    idData: {},
                    lastName: sessionID,
                    pending: true,
                };
                this.sessions[sessionID] = session;

                try {
                    await this.initCollection(sessionID, session);
                } catch (error) {
                    delete this.sessions[sessionID];
                    this.logError(`Failed to create a citation collection for session ${sessionID}`, error);
                    continue;
                } finally {
                    session.pending = false;
                }
            }

            if (!session.collection) {
                continue;
            }

            const citationsByItemID = integrationSession.citationsByItemID || {};
            const sortedItemIDs = this.getSortedItemIDs(integrationSession.citationsByIndex || {});
            await this.updateCitations(sessionID, citationsByItemID, sortedItemIDs, integrationSession.styleClass);
        }
    }

    private async initCollection(sessionID: string, session: SessionData) {
        const collection = new Zotero.Collection();
        (collection as any).libraryID = Zotero.Libraries.userLibraryID;
        collection.name = sessionID;
        collection.addRelation(TEMP_COLLECTION_RELATION, TEMP_COLLECTION_MARKER);
        await collection.saveTx({ skipSelect: true });

        if (this.closing || this.sessions[sessionID] !== session) {
            await collection.eraseTx();
            return;
        }

        session.collection = collection;
    }

    private patchExecCommand() {
        if (this.patchedExecCommand) {
            return;
        }

        this.originalExecCommand = Zotero.Integration.execCommand;
        this.patchedExecCommand = (async (...args: any[]) => {
            this.execCommandDepth += 1;
            let result;
            try {
                result = await (this.originalExecCommand as any).apply(Zotero.Integration, args);
            } finally {
                this.execCommandDepth = Math.max(0, this.execCommandDepth - 1);
            }

            const docId = args[2];
            if (typeof docId === "string" && !this.closing) {
                this.trackTask(this.renameCurrentCollection(docId));
            }
            return result;
        }) as typeof Zotero.Integration.execCommand;
        Zotero.Integration.execCommand = this.patchedExecCommand;
    }

    private restoreExecCommand() {
        if (
            this.originalExecCommand &&
            this.patchedExecCommand &&
            Zotero.Integration.execCommand === this.patchedExecCommand
        ) {
            Zotero.Integration.execCommand = this.originalExecCommand;
        }
        this.originalExecCommand = undefined;
        this.patchedExecCommand = undefined;
    }

    private trackTask(task: Promise<void>) {
        this.pendingTasks.add(task);
        void task
            .catch((error) => this.logError("Failed to rename a citation collection", error))
            .finally(() => this.pendingTasks.delete(task));
    }

    private async renameCurrentCollection(docId: string) {
        const deadline = Date.now() + RENAME_TIMEOUT;
        while (!this.closing && Date.now() < deadline) {
            const sessionID = Zotero.Integration.currentSession?.sessionID;
            const session = sessionID ? this.sessions[sessionID] : undefined;
            if (sessionID && session?.collection) {
                if ([sessionID, session.lastName].includes(session.collection.name)) {
                    const targetName = this.getDocumentName(docId);
                    if (targetName) {
                        addon.data.docId = docId;
                        session.collection.name = targetName;
                        await session.collection.saveTx({ skipSelect: true });
                        session.lastName = targetName;
                    }
                }
                return;
            }
            await Zotero.Promise.delay(50);
        }
    }

    private getDocumentName(docId: string) {
        let targetName = docId;
        try {
            targetName = PathUtils.split(docId).slice(-1)[0];
        } catch {
            // Keep the original document identifier when it is not a filesystem path.
        }
        return targetName?.trim() || "";
    }

    public getSortedItemIDs(citationsByIndex: any) {
        const sortedItemIDs: number[] = [];
        for (const i in citationsByIndex) {
            citationsByIndex[i].citationItems.forEach((item: { id: number }) => {
                if (!sortedItemIDs.includes(item.id)) {
                    sortedItemIDs.push(item.id);
                }
            });
        }
        return sortedItemIDs;
    }

    public async updateCitations(
        sessionID: string,
        citationsByItemID: { [id: string]: any[] },
        sortedItemIDs: number[],
        styleClass: "in-text" | "note",
    ) {
        const getPlainCitation = (id: string) =>
            sortedItemIDs.indexOf(Number(id)) +
            ": " +
            citationsByItemID[id]
                .map((citation) =>
                    styleClass === "note"
                        ? String(sortedItemIDs.indexOf(Number(id)) + 1)
                        : citation.properties.plainCitation,
                )
                .join(", ");
        const targetData: { [id: string]: { plainCitation: string } } = {};
        for (const id of Object.keys(citationsByItemID)) {
            targetData[id] = { plainCitation: getPlainCitation(id) };
        }

        const session = this.sessions[sessionID];
        if (!session || JSON.stringify(targetData) === JSON.stringify(session.idData)) {
            return;
        }

        const targetIDs = Object.keys(targetData)
            .map(Number)
            .filter((id) => {
                const item = Zotero.Items.get(id);
                return item && item.libraryID === Zotero.Libraries.userLibraryID;
            });
        await this.syncCollectionItems(session, targetIDs);
        session.idData = targetData;
        (ZoteroPane.itemsView as any).refreshAndMaintainSelection();
    }

    private async syncCollectionItems(session: SessionData, targetIDs: number[]) {
        const collection = session.collection;
        if (!collection) {
            return;
        }

        const currentIDs = collection.getChildItems(true) as number[];
        const changes = diffItemIDs(currentIDs, targetIDs);
        if (!changes.add.length && !changes.remove.length) {
            return;
        }

        await Zotero.DB.executeTransaction(async () => {
            await collection.removeItems(changes.remove);
            await collection.addItems(changes.add);
        });
    }

    private async clearSession(sessionID: string) {
        const session = this.sessions[sessionID];
        if (!session) {
            return;
        }
        delete this.sessions[sessionID];

        if (session.collection?.id) {
            await session.collection.eraseTx();
        }
    }

    private handleWindowClose = (event: Event) => {
        if (this.closing) {
            return;
        }
        event.preventDefault();
        void this.clear()
            .catch((error) => this.logError("Failed to clear citation collections during shutdown", error))
            .finally(() => window.close());
    };

    /**
     * Stop background work, restore patched APIs and wait for all collection
     * deletions to commit before the plugin or Zotero window is unloaded.
     */
    public clear(): Promise<void> {
        if (!this.clearPromise) {
            this.clearPromise = this.performClear();
        }
        return this.clearPromise;
    }

    private async performClear() {
        this.closing = true;
        if (this.intervalID !== undefined) {
            window.clearInterval(this.intervalID);
            this.intervalID = undefined;
        }
        window.removeEventListener("close", this.handleWindowClose);
        this.restoreExecCommand();

        const activeTasks = [this.pollPromise, ...this.pendingTasks].filter(Boolean) as Promise<void>[];
        await Promise.allSettled(activeTasks);

        const results = await Promise.allSettled(
            Object.keys(this.sessions).map((sessionID) => this.clearSession(sessionID)),
        );
        for (const result of results) {
            if (result.status === "rejected") {
                this.logError("Failed to remove a citation collection", result.reason);
            }
        }
    }

    private logError(context: string, error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        Zotero.logError(new Error(`${context}: ${message}`));
    }
}
