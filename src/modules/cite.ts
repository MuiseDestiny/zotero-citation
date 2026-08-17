let activeCiteItems: Promise<void> | undefined;

const runCiteItems = async () => {
    const sessionPrototype = Zotero.Integration.Session.prototype;
    const originalCite = sessionPrototype.cite;
    const patchedCite = async function (this: any, field: any, addNote = false, addAnnotations = false) {
        let newField;
        let citation;
        if (field) {
            field = await Zotero.Integration.Field.loadExisting(field);

            if (field.type === 1) {
                citation = new Zotero.Integration.Citation(
                    field,
                    await field.unserialize(),
                    await field.getNoteIndex(),
                );
            } else if (field.type === 2) {
                throw new Zotero.Exception.Alert("integration.error.inBibliography");
            } else {
                // A stale TEMP field can be left behind when an integration command
                // is interrupted. Treat it as a new citation, like Zotero does.
                newField = true;
                field = new Zotero.Integration.CitationField(field._field);
                citation = new Zotero.Integration.Citation(field);
            }
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

        const previewFn = async (previewCitation: any, format?: string) => {
            const index = await fieldIndexPromise;
            await citationsByItemIDPromise;
            const [citations, fieldToCitationIndex] = this.getCiteprocLists();
            let previousIndex = index - 1;
            while (previousIndex >= 0 && !(previousIndex in fieldToCitationIndex)) {
                previousIndex -= 1;
            }
            const sliceIndex = (fieldToCitationIndex[previousIndex] ?? -1) + 1;
            const citationID = previewCitation.citationID;
            try {
                return this.style.previewCitationCluster(
                    previewCitation,
                    citations.slice(0, sliceIndex),
                    citations.slice(sliceIndex),
                    format || "rtf",
                );
            } finally {
                // previewCitationCluster() temporarily assigns a citation ID.
                previewCitation.citationID = citationID;
            }
        };
        const io = new Zotero.Integration.CitationEditInterface(
            citation,
            this.style.opt.sort_citations,
            fieldIndexPromise,
            citationsByItemIDPromise,
            previewFn,
        );
        io.isCitingNotes = addNote;
        io.isAddingAnnotations = addAnnotations;
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
            const citationFieldIndex = citation.fieldIndex ?? citation._fieldIndex;
            let citationField = citation.field ?? citation._field;
            if (fields) {
                citationField = new Zotero.Integration.CitationField(fields[citationFieldIndex]);
                citation.field = citationField;
            }
            await this.addCitation(citationFieldIndex, await citationField.getNoteIndex(), citation);
        }
        return citations;
    };
    sessionPrototype.cite = patchedCite;
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
    try {
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
                addon.data.docId,
                1,
            );
        }
    } finally {
        // Do not overwrite a newer patch installed by Zotero or another plugin.
        if (sessionPrototype.cite === patchedCite) {
            sessionPrototype.cite = originalCite;
        }
    }
    // window.setTimeout(async () => {
    //     await ZoteroPane.itemsView.refreshAndMaintainSelection()
    // }, 1e3) 
};

export const citeItems = (): Promise<void> => {
    if (activeCiteItems) {
        return activeCiteItems;
    }

    const task = runCiteItems().finally(() => {
        if (activeCiteItems === task) {
            activeCiteItems = undefined;
        }
    });
    activeCiteItems = task;
    return task;
};
