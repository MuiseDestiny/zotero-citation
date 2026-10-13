import { getString } from "./locale";
import { selectCitationSession } from "./citationUtils";
import { patchMethod } from "./patch";
import { isWordDropTarget } from "./wordTarget";
import { config } from "../../package.json";

class Views {
    private cleanups: (() => void)[] = [];
    private columnKey?: string;
    private draggedItems?: Zotero.Item[];
    private citationDragRow?: Element;
    private closed = false;
    private icons = new Map<HTMLElement, { background: string; className: string }>();

    public async createCitationColumn() {
        const registeredKey = await Zotero.ItemTreeManager.registerColumns({
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
            renderCell: (_index, data, column, _isFirstColumn?: boolean, ownerDocument = document) => {
                const span = ownerDocument.createElement("span");
                span.className = `cell ${column?.className || ""}`;
                span.dataset.zoteroCitationDrag = "true";
                span.style.pointerEvents = "auto";
                span.title = getString("drag-citation");
                span.textContent = data?.replace(/^\d+:\s*/, "") || "";
                return span;
            },
            pluginID: config.addonID,
        });
        if (typeof registeredKey === "string") {
            this.columnKey = registeredKey;
        }
    }

    public async dragCite() {
        const itemsView = ZoteroPane.itemsView as any;
        this.cleanups.push(
            patchMethod(itemsView, "onDragStart", (original: any) => (event: DragEvent, index: number) => {
                this.draggedItems = undefined;
                const result = original.call(itemsView, event, index);
                const target = event.target as Element | null;
                const origin = this.citationDragRow;
                this.citationDragRow = undefined;
                // dragstart targets the draggable row, so remember the cell pressed
                // before the native drag started.
                const fromCitation =
                    target?.closest?.('[data-zotero-citation-drag="true"]') ||
                    (origin && (event.currentTarget === origin || target === origin));
                if (!fromCitation || !this.isCitationVisible()) {
                    return result;
                }
                const items = ZoteroPane.getSelectedItems();
                if (!items.length || items.some((item) => !item.isRegularItem()) || !event.dataTransfer) {
                    return result;
                }
                this.draggedItems = [...items];
                // Only an explicit drag from the citation cell replaces native content.
                event.dataTransfer.clearData();
                event.dataTransfer.setData("text/plain", "");
                event.dataTransfer.effectAllowed = "copy";
                return result;
            }),
        );
        document.addEventListener("dragend", this.handleDragEnd, true);
        document.addEventListener("mousedown", this.handleMouseDown, true);
        document.addEventListener("keydown", this.handleDragCancel, true);
        this.cleanups.push(() => {
            document.removeEventListener("dragend", this.handleDragEnd, true);
            document.removeEventListener("mousedown", this.handleMouseDown, true);
            document.removeEventListener("keydown", this.handleDragCancel, true);
        });
    }

    private handleMouseDown = (event: MouseEvent) => {
        const target = event.target as Element | null;
        this.citationDragRow =
            event.button === 0 && target?.closest?.('[data-zotero-citation-drag="true"]')
                ? target.closest('[draggable="true"]') || undefined
                : undefined;
    };

    private handleDragCancel = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            this.draggedItems = undefined;
            this.citationDragRow = undefined;
        }
    };

    private handleDragEnd = (event: DragEvent) => {
        const items = this.draggedItems;
        this.draggedItems = undefined;
        this.citationDragRow = undefined;
        if (!items || this.closed || !this.isCitationVisible() || event.dataTransfer?.dropEffect === "none") {
            return;
        }
        void this.finishDrag(event, items).catch((error) => Zotero.logError(error));
    };

    private async finishDrag(event: DragEvent, items: Zotero.Item[]) {
        if (!this.closed && addon.data.alive !== false && isWordDropTarget(event)) {
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
        const columns = (ZoteroPane.itemsView as any)?._columns;
        return Boolean(columns?.some((column: any) => column.dataKey === this.columnKey && !column.hidden));
    }

    public async clear() {
        this.closed = true;
        this.draggedItems = undefined;
        this.citationDragRow = undefined;
        for (const cleanup of this.cleanups.splice(0).reverse()) {
            cleanup();
        }
        for (const [icon, previous] of this.icons) {
            icon.style.backgroundImage = previous.background;
            icon.className = previous.className;
        }
        this.icons.clear();
        if (this.columnKey) {
            await Zotero.ItemTreeManager.unregisterColumns(this.columnKey);
            this.columnKey = undefined;
        }
    }
}

export default Views;
