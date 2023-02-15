export const citeFromSelectedItems = async () => {
	const cite = Zotero.Integration.Session.prototype.cite
	Zotero.Integration.Session.prototype.cite = async function (field: any, addNote = false) {
		var newField;
		var citation;
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

		var fieldIndexPromise, citationsByItemIDPromise;
		if (!this.data.prefs.delayCitationUpdates
			|| !Object.keys(this.citationsByItemID).length
			|| this._sessionUpToDate) {
			fieldIndexPromise = this.getFields().then(async function (fields) {
				for (var i = 0, n = fields.length; i < n; i++) {
					if (await fields[i].equals(field._field)) {
						// This is needed, because LibreOffice integration plugin caches the field code instead of asking
						// the document every time when calling #getCode().
						field = new Zotero.Integration.CitationField(fields[i]);
						return i;
					}
				}
				return -1;
			});
			citationsByItemIDPromise = this.updateFromDocument(0).then(function () {
				return this.citationsByItemID;
			}.bind(this));
		}
		else {
			fieldIndexPromise = Zotero.Promise.resolve(-1);
			citationsByItemIDPromise = Zotero.Promise.resolve(this.citationsByItemID);
		}
		var io = new Zotero.Integration.CitationEditInterface(
			citation, this.style.opt.sort_citations,
			fieldIndexPromise, citationsByItemIDPromise
		);
		console.log(io)
		ZoteroPane.getSelectedItems().map(i => {
			io.citation.citationItems.push({ id: i.id })
		})

		if (!io.citation.citationItems.length) {
			// Try to delete new field on cancel
			if (newField) {
				try {
					await field.delete();
				} catch (e) { }
			}
			throw new Zotero.Exception.UserCancelled("inserting citation");
		}

		var fieldIndex = await fieldIndexPromise;
		// Make sure session is updated
		await citationsByItemIDPromise;

		let citations = await this._insertCitingResult(fieldIndex, field, io.citation);
		if (!this.data.prefs.delayCitationUpdates) {
			if (citations.length != 1) {
				// We need to refetch fields because we've inserted multiple.
				// This is not super optimal, but you're inserting 2+ citations at the time,
				// so that sets it off
				var fields = await this.getFields(true);
			}
			// And resync citations with ones in the doc
			await this.updateFromDocument(0);
		}
		for (let citation of citations) {
			if (fields) {
				citation._field = new Zotero.Integration.CitationField(fields[citation._fieldIndex]);
			}
			await this.addCitation(citation._fieldIndex, await citation._field.getNoteIndex(), citation);
		}
		return citations;
	};
	await Zotero.Integration.execCommand(
		Zotero.Integration?.currentSession?.agent || "WinWord",
		'addEditCitation',
		"__doc__",
		1
	)
	Zotero.Integration.Session.prototype.cite = cite
}







