import hooks from "./hooks";
import { citeItems } from "./modules/cite";
import type Citation from "./modules/citation";
import type Views from "./modules/views";

class Addon {
    public data: {
        alive: boolean;
        // Env type, see build.js
        env: "development" | "production";
        locale?: {
            current: any;
        };
        prefs?: {
            window: Window;
            rows: Array<{ [dataKey: string]: string }>;
        };
        citation?: Citation;
        views?: Views;
        startupPromise?: Promise<void>;
    };
    // Lifecycle hooks
    public hooks: typeof hooks;
    // APIs
    public api: {
        citeItems: typeof citeItems;
    };

    constructor() {
        this.data = {
            alive: true,
            env: __env__,
        };
        this.hooks = hooks;
        this.api = { citeItems: citeItems };
    }
}

export default Addon;
