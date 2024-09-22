import ZoteroToolkit from "zotero-plugin-toolkit";
import hooks from "./hooks";
import { citeItems } from "./modules/cite";

class Addon {
    public data: {
        alive: boolean;
        // Env type, see build.js
        env: "development" | "production";
        // ztoolkit: MyToolkit;
        ztoolkit: ZoteroToolkit;
        locale?: {
            current: any;
        };
        prefs?: {
            window: Window;
            rows: Array<{ [dataKey: string]: string }>;
        };
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
            // ztoolkit: new MyToolkit(),
            ztoolkit: new ZoteroToolkit(),
        };
        this.hooks = hooks;
        this.api = { citeItems: citeItems };
    }
}

export default Addon;
