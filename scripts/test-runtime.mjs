import { mkdtemp, mkdir, cp, readFile, writeFile, open } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const binary = process.env.ZOTERO_BIN || "/Applications/Zotero.app/Contents/MacOS/zotero";
const directory = await mkdtemp(path.join(tmpdir(), "citation-runtime-"));
const profile = path.join(directory, "profile");
const addon = path.join(directory, "addon");
const data = path.join(directory, "data");
const resultPath = path.join(directory, "result.json");
await mkdir(path.join(profile, "extensions"), { recursive: true });
await mkdir(data);
await cp(path.join(root, "build/addon"), addon, { recursive: true });
await writeFile(path.join(profile, "extensions/zoterocitation@polygon.org"), addon);
const preferences = {
    "extensions.zotero.useDataDir": true,
    "extensions.zotero.dataDir": data,
    "extensions.zotero.firstRun2": false,
    "extensions.zotero.firstRunGuidance": false,
    "extensions.autoDisableScopes": 0,
    "extensions.enabledScopes": 15,
    "extensions.update.enabled": false,
    "app.update.auto": false,
    "xpinstall.signatures.required": false,
    "extensions.zotero.httpServer.enabled": false,
};
await writeFile(
    path.join(profile, "user.js"),
    Object.entries(preferences)
        .map(([key, value]) => `user_pref(${JSON.stringify(key)}, ${JSON.stringify(value)});`)
        .join("\n"),
);
const bootstrap = path.join(addon, "bootstrap.js");
const original = await readFile(bootstrap, "utf8");
const entry = "Services.scriptloader.loadSubScript(`${rootURI}/chrome/content/scripts/index.js`, ctx);";
if (!original.includes(entry)) throw new Error("Cannot locate the test addon's bootstrap entry");
const fixtureURL = pathToFileURL(path.join(root, "test/zotero-runtime.js")).href;
await writeFile(
    bootstrap,
    original.replace(
        entry,
        `${entry}\n    Services.scriptloader.loadSubScript(${JSON.stringify(
            fixtureURL,
        )}, { Zotero, IOUtils, Services, ChromeUtils, resultPath: ${JSON.stringify(resultPath)} });`,
    ),
);
const log = await open(path.join(directory, "runtime.log"), "w");
console.log(`Isolated Zotero runtime: ${directory}`);
const child = spawn(binary, ["-no-remote", "-profile", profile, "-purgecaches"], { stdio: ["ignore", log.fd, log.fd] });
const timeout = setTimeout(() => child.kill("SIGTERM"), 90000);
try {
    await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("exit", resolve);
    });
    const result = JSON.parse(await readFile(resultPath, "utf8"));
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
} finally {
    clearTimeout(timeout);
    await log.close();
}
