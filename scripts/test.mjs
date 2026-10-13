import { build } from "esbuild";
import "../test/startup.test.mjs";

const result = await build({
    entryPoints: ["test/index.ts"],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node18",
    write: false,
});

const source = result.outputFiles[0].text;
await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
