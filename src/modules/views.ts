import { getString } from "./locale";
import { selectCitationSession } from "./citationUtils";
import { patchMethod } from "./patch";
import { isWordDropTarget } from "./wordTarget";
import { config } from "../../package.json";

class Views {
    private cleanups: (() => void)[] = [];
    private columnKey?: string;
    private draggedItems?: Zotero.Item[];
    private dragCancelled = false;
    private closed = false;
    private icons = new Map<HTMLElement, { background: string; className: string }>();

    public async createCitationColumn() {
        const manager = Zotero.ItemTreeManager as any;
        const options = {
            dataKey: "citation",
            label: getString("column-citation"),
            zoteroPersist: ["width", "hidden", "sortDirection"],
            dataProvider: (item: Zotero.Item) => {
                const currentSession = Zotero.Integration.currentSession;
                const collectionsView = ZoteroPane.collectionsView as any;
                const selectedCollection =
                    typeof collectionsView.getSelectedCollections === "function"
                        ? collectionsView.getSelectedCollections()?.[0]
                        : collectionsView.getSelectedCollection?.();
                const sessions = Zotero.ZoteroCitation.api.sessions;
                const session = selectCitationSession(
                    selectedCollection,
                    Object.values(sessions),
                    currentSession ? sessions[currentSession.sessionID] : undefined,
                ) as SessionData | undefined;
                return session?.idData[item.id]?.plainCitation || "";
            },
            renderCell: (
                _index: number,
                data: string,
                column: any,
                _isFirstColumn?: boolean,
                ownerDocument = document,
            ) => {
                const span = ownerDocument.createElement("span");
                span.className = `cell ${column?.className || ""}`;
                span.style.pointerEvents = "auto";
                span.title = getString("drag-citation");
                span.textContent = data?.replace(/^\d+:\s*/, "") || "";
                return span;
            },
            pluginID: config.addonID,
        };
        const registered = await (manager.registerColumn
            ? manager.registerColumn(options)
            : manager.registerColumns(options));
        const key = Array.isArray(registered) ? registered[0] : registered;
        if (typeof key !== "string") throw new Error("Failed to register the citation column");
        this.columnKey = key;
    }

    public async dragCite() {
        document.addEventListener("dragstart", this.handleDragStart, true);
        document.addEventListener("dragend", this.handleDragEnd, true);
        document.addEventListener("drop", this.handleInternalDrop, true);
        document.addEventListener("keydown", this.handleDragCancel, true);
        this.cleanups.push(() => {
            document.removeEventListener("dragstart", this.handleDragStart, true);
            document.removeEventListener("dragend", this.handleDragEnd, true);
            document.removeEventListener("drop", this.handleInternalDrop, true);
            document.removeEventListener("keydown", this.handleDragCancel, true);
        });
    }

    private handleDragStart = (event: DragEvent) => {
        this.draggedItems = undefined;
        this.dragCancelled = false;
        if (!this.isCitationVisible() || !event.dataTransfer) return;
        const itemsView = ZoteroPane.itemsView as any;
        const target = event.target as HTMLElement;
        // Zotero 11 uses treeitem; older virtual tables use row. Identify the
        // actual item row independently of its accessibility role.
        const row = target.closest?.(".row[id]");
        if (!row || !itemsView.domEl?.contains(row)) return;
        const match = row.id.match(/-row-(\d+)$/);
        if (!match) return;
        const index = Number(match[1]);
        const item = itemsView.getRow(index)?.ref;
        if (!item?.isRegularItem?.()) return;
        const items: Zotero.Item[] = itemsView.selection.isSelected(index) ? itemsView.getSelectedItems() : [item];
        if (!items.length || items.some((item) => !item.isRegularItem())) return;
        if (!itemsView.selection.isSelected(index)) itemsView.selection.select(index);
        const selectedIDs = new Set(items.map((item) => item.id));
        const orderedItems: Zotero.Item[] = itemsView.getSortedItems?.() || items;
        this.draggedItems = orderedItems.filter((item) => selectedIDs.has(item.id));
        // Handle this DOM drag before native Quick Copy runs, including asynchronous
        // exporters. Keep the item flavor used by Zotero's collection drop handlers.
        event.stopImmediatePropagation();
        // Preserve the virtual table's mouseup guard when skipping its row handler.
        itemsView.tree?._onDragStart?.();
        const transfer = event.dataTransfer;
        transfer.effectAllowed = "copyMove";
        transfer.setData("zotero/item", this.draggedItems.map((item) => item.id).join(","));
        transfer.setData("text/plain", "");
        transfer.setDragImage(row, 0, 0);
    };

    private handleInternalDrop = () => {
        this.draggedItems = undefined;
    };

    private handleDragCancel = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            this.dragCancelled = true;
            this.draggedItems = undefined;
        }
    };

    private handleDragEnd = (event: DragEvent) => {
        const items = this.draggedItems;
        this.draggedItems = undefined;
        if (!items || this.closed || this.dragCancelled || !this.isCitationVisible()) {
            return;
        }
        // Empty-text external drops can report "none" even when released over Word.
        // Gecko's native cancellation flag distinguishes Escape from that case.
        if ((event.dataTransfer as any)?.mozUserCancelled) return;
        void this.finishDrag(items).catch((error) => Zotero.logError(error));
    };

    private async finishDrag(items: Zotero.Item[]) {
        if (!this.closed && addon.data.alive !== false && isWordDropTarget()) {
            await addon.api.citeItems(items);
        }
    }

    public async patchIcon() {
        const tree = ZoteroPane.collectionsView as any;
        this.cleanups.push(
            patchMethod(tree, "renderItem", (original: any) => (...args: any[]) => {
                const oldIcon = args[2]?.querySelector(".cell-icon");
                const previous = this.icons.get(oldIcon);
                if (previous) {
                    oldIcon.style.backgroundImage = previous.background;
                    oldIcon.className = previous.className;
                    this.icons.delete(oldIcon);
                }
                const div = original.apply(tree, args) as HTMLElement;
                const icon = div.querySelector<HTMLElement>(".cell-icon");
                if (!icon) {
                    return div;
                }
                const row = tree.getRow(args[0]);
                if (
                    Object.values(Zotero.ZoteroCitation.api.sessions).some(
                        (session: any) => session.collection?.key === row?.ref?.key,
                    )
                ) {
                    for (const old of this.icons.keys()) {
                        if (!old.isConnected) this.icons.delete(old);
                    }
                    this.icons.set(icon, { background: icon.style.backgroundImage, className: icon.className });
                    icon.style.backgroundImage = `url(chrome://${config.addonRef}/content/icons/word.png)`;
                    icon.classList.remove("icon-collection", "icon-search");
                    icon.classList.add("icon-publications");
                }
                return div;
            }),
        );
    }

    private isCitationVisible() {
        const view = ZoteroPane.itemsView as any;
        const columns = view?._getColumns?.() || view?._columns;
        return Boolean(columns?.some((column: any) => column.dataKey === this.columnKey && !column.hidden));
    }

    public async clear() {
        this.closed = true;
        this.draggedItems = undefined;
        for (const cleanup of this.cleanups.splice(0).reverse()) {
            cleanup();
        }
        for (const [icon, previous] of this.icons) {
            icon.style.backgroundImage = previous.background;
            icon.className = previous.className;
        }
        this.icons.clear();
        if (this.columnKey) {
            const manager = Zotero.ItemTreeManager as any;
            await (manager.unregisterColumn
                ? manager.unregisterColumn(this.columnKey)
                : manager.unregisterColumns(this.columnKey));
            this.columnKey = undefined;
        }
    }
}

export default Views;
