export interface SearchConditionLike {
    condition: string;
    operator: string;
    value: string;
}

export function isLegacyCitationSearch(conditions: Record<string, SearchConditionLike>): boolean {
    const values = Object.values(conditions);
    if (values.length !== 1) {
        return false;
    }

    const condition = values[0];
    return condition.condition === "title" && condition.operator === "contains" && condition.value === "";
}

export function diffItemIDs(current: number[], target: number[]) {
    const currentIDs = new Set(current);
    const targetIDs = new Set(target);

    return {
        add: [...targetIDs].filter((id) => !currentIDs.has(id)),
        remove: [...currentIDs].filter((id) => !targetIDs.has(id)),
    };
}
