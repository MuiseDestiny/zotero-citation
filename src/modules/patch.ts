export function patchMethod<T extends object, K extends keyof T>(
    target: T,
    key: K,
    wrapper: (original: T[K]) => T[K],
): () => void {
    const original = target[key];
    const wrapped = wrapper(original);
    let enabled = true;
    const patched = function (this: unknown, ...args: unknown[]) {
        return (enabled ? wrapped : (original as any)).apply(this, args);
    } as T[K];
    target[key] = patched;

    return () => {
        enabled = false;
        // Another plugin may wrap our method; its wrapper must remain intact.
        if (target[key] === patched) {
            target[key] = original;
        }
    };
}
