export const citeItems = async () => {
    const cite = Zotero.Integration.Session.prototype.cite;
    Zotero.Integration.Session.prototype.cite = async function (field: any, addNote = false) {
        let newField;
        let citation;
        if (field) {
            field = await Zotero.Integration.Field.loadExisting(field);

            if (field.type != 1) {
                throw new Zotero.Exception.Alert("integration.error.notInCitation");
            }
            citation = new Zotero.Integration.Citation(field, await field.unserialize(), await field.getNoteIndex());
        } else {
            newField = true;
            field = new Zotero.Integration.CitationField(await this.addField(true));
            citation = new Zotero.Integration.Citation(field);
        }

        await citation.prepareForEditing();

        // -------------------
        // Preparing data to pass into CitationEditInterface

        let fieldIndexPromise, citationsByItemIDPromise;
        if (
            !this.data.prefs.delayCitationUpdates ||
            !Object.keys(this.citationsByItemID).length ||
            this._sessionUpToDate
        ) {
            fieldIndexPromise = this.getFields().then(async function (fields: any) {
                for (let i = 0, n = fields.length; i < n; i++) {
                    if (await fields[i].equals(field._field)) {
                        // This is needed, because LibreOffice integration plugin caches the field code instead of asking
                        // the document every time when calling #getCode().
                        field = new Zotero.Integration.CitationField(fields[i]);
                        return i;
                    }
                }
                return -1;
            });
            citationsByItemIDPromise = this.updateFromDocument(0).then(() => {
                return this.citationsByItemID;
            });
        } else {
            //@ts-ignore Promise has resolve()
            fieldIndexPromise = Zotero.Promise.resolve(-1);
            //@ts-ignore Promise has resolve()
            citationsByItemIDPromise = Zotero.Promise.resolve(this.citationsByItemID);
        }
        const io = new Zotero.Integration.CitationEditInterface(
            citation,
            this.style.opt.sort_citations,
            fieldIndexPromise,
            citationsByItemIDPromise,
        );
        let items: Zotero.Item[];
        if (Zotero_Tabs.selectedIndex == 0) {
            items = ZoteroPane.getSelectedItems();
        } else {
            items = [
                Zotero.Items.get(Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)!.itemID as number)
                    .parentItem as Zotero.Item,
            ];
        }
        items.map((i) => {
            const id = i.id;
            if (!io.citation.citationItems.find((i: { id: number }) => i.id == id)) {
                io.citation.citationItems.push({ id });
            }
        });
        if (!io.citation.citationItems.length) {
            // Try to delete new field on cancel
            if (newField) {
                try {
                    await field.delete();
                } catch (e) {
                    /* empty */
                }
            }
            throw new Zotero.Exception.UserCancelled("inserting citation");
        }

        const fieldIndex = await fieldIndexPromise;
        // Make sure session is updated
        await citationsByItemIDPromise;

        const citations = await this._insertCitingResult(fieldIndex, field, io.citation);
        if (!this.data.prefs.delayCitationUpdates) {
            if (citations.length != 1) {
                // We need to refetch fields because we've inserted multiple.
                // This is not super optimal, but you're inserting 2+ citations at the time,
                // so that sets it off
                // eslint-disable-next-line no-var
                var fields = await this.getFields(true);
            }
            // And resync citations with ones in the doc
            await this.updateFromDocument(0);
        }
        for (const citation of citations) {
            if (fields) {
                citation._field = new Zotero.Integration.CitationField(fields[citation._fieldIndex]);
            }
            await this.addCitation(citation._fieldIndex, await citation._field.getNoteIndex(), citation);
        }
        return citations;
    };
    /**
     * MacWord16
     * /Applications/Microsoft Word.app/
     */
    // osascript -e 'tell app "Microsoft Word" to name of windows'
    // tasklist /FI "IMAGENAME eq WINWORD.EXE" /v /fo list
    /**
     * Zotero.Utilities.Internal.exec("C:\\WINDOWS\\system32\\cmd.exe", [
     * "tasklist", "/FI", '"IMAGENAME eq WINWORD.EXE"', "/v", "/fo", "list"]);
     */
    if (Zotero.isMac) {
        await Zotero.Integration.execCommand(
            Zotero.Integration?.currentSession?.agent || "MacWord16",
            "addEditCitation",
            "/Applications/Microsoft Word.app/",
            2,
        );
    } else {
        await Zotero.Integration.execCommand(
            Zotero.Integration?.currentSession?.agent || "WinWord",
            "addEditCitation",
            "__doc__",
            1,
        );
    }
    Zotero.Integration.Session.prototype.cite = cite;
    // window.setTimeout(async () => {
    //     await ZoteroPane.itemsView.refreshAndMaintainSelection()
    // }, 1e3) 
};
