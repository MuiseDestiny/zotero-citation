import { diffItemIDs } from "./citationUtils";
import { matchWordDocumentNames, readWordDocuments } from "./wordDocuments";

// Retained only to clean up collections created by releases that used a
// synced relation marker. New collections are tracked in a local preference.
const TEMP_COLLECTION_RELATION = "dc:relation";
const TEMP_COLLECTION_MARKER = "https://github.com/MuiseDestiny/zotero-citation#temporary-collection";
const TEMP_COLLECTION_KEYS_PREF = "zotero-citation.temporaryCollectionKeys";
const NAME_REFRESH_INTERVAL = 5000;

export default class Citation {
    public sessions: { [sessionID: string]: SessionData } = {};

    private intervalID?: number;
    private pollPromise?: Promise<void>;
    private clearPromise?: Promise<void>;
    private closing = false;
    private nextNameRefresh = 0;
    private unnamedDocumentIndex = 0;
    private documentNames = new Map<string, string>();
    private temporaryCollectionKeys = new Set<string>();

    constructor() {
        Zotero.ZoteroCitation.api.sessions = this.sessions;
    }

    /**
     * Remove only temporary collections whose ownership was recorded by the plugin.
     */
    private async clearStaleArtifacts() {
        const libraryID = Zotero.Libraries.userLibraryID;
        const collections = (Zotero.Collections as any).getByLibrary(libraryID, true, true) as Zotero.Collection[];
        const collectionsByKey = new Map(collections.map((collection) => [collection.key, collection]));
        const removedCollectionKeys = new Set<string>();

        this.temporaryCollectionKeys = this.loadTemporaryCollectionKeys();
        const remainingCollectionKeys = new Set<string>();
        for (const key of this.temporaryCollectionKeys) {
            const collection = collectionsByKey.get(key);
            if (!collection) {
                continue;
            }
            try {
                await collection.eraseTx();
                removedCollectionKeys.add(key);
            } catch (error) {
                remainingCollectionKeys.add(key);
                this.logError("Failed to remove a stale citation collection", error);
            }
        }
        this.temporaryCollectionKeys = remainingCollectionKeys;
        this.saveTemporaryCollectionKeys();

        for (const collection of collections) {
            if (removedCollectionKeys.has(collection.key)) {
                continue;
            }
            try {
                await collection.loadDataType("relations");
                const isTemporaryCollection = collection
                    .getRelationsByPredicate(TEMP_COLLECTION_RELATION)
                    .includes(TEMP_COLLECTION_MARKER);
                if (isTemporaryCollection) {
                    await collection.eraseTx();
                }
            } catch (error) {
                this.logError("Failed to remove a stale citation collection", error);
            }
        }

        // Old saved searches have no ownership marker. Their conditions can also
        // be user-authored, so leave them for the user to remove manually.
    }

    /**
     * Watch Word integration sessions and keep their temporary collections in sync.
     */
    public async listener(t: number) {
        await this.clearStaleArtifacts();
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
        if (this.closing || Zotero.Integration.currentDoc) {
            return;
        }

        const integrationSessions = Zotero.Integration.sessions;
        const wordSessionIDs = Object.keys(integrationSessions).filter((sessionID) =>
            String(integrationSessions[sessionID].agent).includes("Word"),
        );
        const activeSessionIDs = new Set(wordSessionIDs);

        if (wordSessionIDs.length && Date.now() >= this.nextNameRefresh) {
            this.nextNameRefresh = Date.now() + NAME_REFRESH_INTERVAL;
            try {
                const documents = await readWordDocuments();
                if (!Zotero.Integration.currentDoc) this.documentNames = matchWordDocumentNames(documents);
            } catch (error) {
                this.logError("Failed to read Word document names", error);
            }
        }

        for (const sessionID of Object.keys(this.sessions)) {
            if (!activeSessionIDs.has(sessionID)) {
                await this.clearSession(sessionID);
            }
        }

        if (this.closing) {
            return;
        }

        for (const sessionID of wordSessionIDs) {
            if (this.closing || Zotero.Integration.currentDoc) {
                return;
            }

            const integrationSession = integrationSessions[sessionID];
            let session = this.sessions[sessionID];
            if (!session) {
                session = {
                    collection: undefined,
                    idData: {},
                    lastName: this.documentNames.get(sessionID) || `Word (${++this.unnamedDocumentIndex})`,
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

            await this.renameCollection(sessionID, this.documentNames.get(sessionID));
            if (this.closing || Zotero.Integration.currentDoc) return;

            const citationsByItemID = integrationSession.citationsByItemID || {};
            const sortedItemIDs = this.getSortedItemIDs(integrationSession.citationsByIndex || {});
            await this.updateCitations(sessionID, citationsByItemID, sortedItemIDs, integrationSession.styleClass);
        }
    }

    private async initCollection(sessionID: string, session: SessionData) {
        const collection = new Zotero.Collection();
        (collection as any).libraryID = Zotero.Libraries.userLibraryID;
        collection.name = session.lastName;
        await collection.saveTx({ skipSelect: true });

        this.temporaryCollectionKeys.add(collection.key);
        this.saveTemporaryCollectionKeys();

        if (this.closing || this.sessions[sessionID] !== session) {
            await collection.eraseTx();
            this.temporaryCollectionKeys.delete(collection.key);
            this.saveTemporaryCollectionKeys();
            return;
        }

        session.collection = collection;
    }

    private async renameCollection(sessionID: string, name?: string) {
        const session = this.sessions[sessionID];
        const collection = session?.collection;
        if (!name || !collection || collection.name === name || this.closing) return;
        if (collection.name !== session.lastName && collection.name !== sessionID) return;
        const previous = collection.name;
        collection.name = name;
        try {
            await collection.saveTx({ skipSelect: true });
            session.lastName = name;
        } catch (error) {
            collection.name = previous;
            throw error;
        }
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
        const changedIDs = [...new Set([...Object.keys(session.idData), ...Object.keys(targetData)])].map(Number);
        await this.syncCollectionItems(session, targetIDs);
        session.idData = targetData;
        await Zotero.Notifier.trigger("redraw", "item", changedIDs);
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
            this.temporaryCollectionKeys.delete(session.collection.key);
            this.saveTemporaryCollectionKeys();
        }
    }

    private loadTemporaryCollectionKeys() {
        const value = Zotero.Prefs.get(TEMP_COLLECTION_KEYS_PREF);
        if (typeof value !== "string") {
            return new Set<string>();
        }

        try {
            const keys = JSON.parse(value);
            return new Set(Array.isArray(keys) ? keys.filter((key): key is string => typeof key === "string") : []);
        } catch {
            return new Set<string>();
        }
    }

    private saveTemporaryCollectionKeys() {
        Zotero.Prefs.set(TEMP_COLLECTION_KEYS_PREF, JSON.stringify([...this.temporaryCollectionKeys]));
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
        const activeTasks = [this.pollPromise].filter(Boolean) as Promise<void>[];
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
