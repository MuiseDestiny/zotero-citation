interface CitationCollectionLike {
    key?: string;
}

interface CitationSessionLike {
    collection?: CitationCollectionLike;
}

export function diffItemIDs(current: number[], target: number[]) {
    const currentIDs = new Set(current);
    const targetIDs = new Set(target);

    return {
        add: [...targetIDs].filter((id) => !currentIDs.has(id)),
        remove: [...currentIDs].filter((id) => !targetIDs.has(id)),
    };
}

export function selectCitationSession<T extends CitationSessionLike>(
    selectedCollection: CitationCollectionLike | null | undefined,
    sessions: T[],
    activeSession: T | undefined,
): T | undefined {
    if (!selectedCollection?.key) {
        return activeSession ?? (sessions.length === 1 ? sessions[0] : undefined);
    }

    const selectedSession = sessions.find((session) => session.collection?.key === selectedCollection.key);
    return selectedSession ?? activeSession ?? (sessions.length === 1 ? sessions[0] : undefined);
}

export function isLocalItemID(id: unknown): boolean {
    return /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
}
