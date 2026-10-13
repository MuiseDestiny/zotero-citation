export interface WordDocumentInfo {
    name: string;
    data: string;
}

// Word integration stores its session data in consecutive ZOTERO_PREF_N
// properties. Match that data, not the foreground window or an application path.
const MAC_DOCUMENTS_SCRIPT = `
if application "Microsoft Word" is not running then return ""
set resultText to ""
with timeout of 8 seconds
    tell application "Microsoft Word"
        set openDocuments to get documents
        repeat with doc in openDocuments
            try
                set docName to name of doc
                set docData to ""
                set propertyIndex to 1
                repeat
                    try
                        set part to value of custom document property ("ZOTERO_PREF_" & propertyIndex) of doc
                        if part is missing value or part is "" then exit repeat
                        set docData to docData & part
                        set propertyIndex to propertyIndex + 1
                    on error
                        exit repeat
                    end try
                end repeat
                set resultText to resultText & docName & (ASCII character 31) & docData & (ASCII character 30)
            end try
        end repeat
    end tell
end timeout
return resultText`;

const WINDOWS_DOCUMENTS_SCRIPT = `
$ErrorActionPreference = 'Stop'
$word = $null
try {
    $word = [Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
    $records = @()
    foreach ($doc in $word.Documents) {
        $properties = $null
        try {
            $properties = $doc.CustomDocumentProperties
            $data = ''
            for ($i = 1; ; $i++) {
                $property = $null
                try {
                    $property = $properties.Item('ZOTERO_PREF_' + $i)
                    $part = [string]$property.Value
                    if (!$part) { break }
                    $data += $part
                } catch { break }
                finally { if ($property) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($property) } }
            }
            $records += @{ name = [string]$doc.Name; data = $data }
        } finally {
            if ($properties) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($properties) }
            [void][Runtime.InteropServices.Marshal]::ReleaseComObject($doc)
        }
    }
    [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
    ConvertTo-Json -InputObject @($records) -Compress -Depth 3
} catch { '[]' }
finally { if ($word) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word) } }
`;

async function queryWord(command: string, args: string[]): Promise<string> {
    let subprocess: any;
    try {
        subprocess = (ChromeUtils as any).importESModule("resource://gre/modules/Subprocess.sys.mjs").Subprocess;
    } catch {
        subprocess = (ChromeUtils as any).import("resource://gre/modules/Subprocess.jsm").Subprocess;
    }
    const executable = command.includes("/") ? command : await subprocess.pathSearch(command);
    const process = await subprocess.call({ command: executable, arguments: args });
    let timedOut = false;
    // Word may be busy in a modal dialog. Bound the query so shutdown never waits
    // indefinitely for Apple events or a Windows COM call.
    const timeout = setTimeout(() => {
        timedOut = true;
        void process.kill(0).catch(() => {});
    }, 10000);
    try {
        let output = "";
        let part;
        while ((part = await process.stdout.readString())) output += part;
        const { exitCode } = await process.wait();
        if (timedOut) throw new Error("Word document-name query timed out");
        if (exitCode !== 0) throw new Error(`Word document-name query failed (${exitCode})`);
        return output;
    } finally {
        clearTimeout(timeout);
    }
}

export async function readWordDocuments(): Promise<WordDocumentInfo[]> {
    if (Zotero.isMac) {
        const output = await queryWord("/usr/bin/osascript", ["-e", MAC_DOCUMENTS_SCRIPT]);
        return output.split("\x1e").flatMap((record) => {
            const separator = record.indexOf("\x1f");
            return separator < 0 ? [] : [{ name: record.slice(0, separator), data: record.slice(separator + 1) }];
        });
    }
    if (Zotero.isWin) {
        const output = await queryWord("powershell.exe", [
            "-NoLogo",
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            WINDOWS_DOCUMENTS_SCRIPT,
        ]);
        const records = JSON.parse(output.trim() || "[]");
        return Array.isArray(records) ? records : [];
    }
    return [];
}

export function matchWordDocumentNames(documents: WordDocumentInfo[]): Map<string, string> {
    const names = new Map<string, string>();
    const ambiguous = new Set<string>();
    for (const document of documents) {
        const name = document.name?.trim();
        if (!name || !document.data) continue;
        try {
            const data = new (Zotero.Integration as any).DocumentData(document.data);
            const id = data.sessionID;
            if (!id) continue;
            // A duplicated Word file can retain the same session ID. Do not assign
            // either file's name to a shared session until Zotero separates them.
            if (names.has(id)) ambiguous.add(id);
            else names.set(id, name);
        } catch {
            // Documents without valid Zotero metadata do not belong to a session.
        }
    }
    for (const id of ambiguous) names.delete(id);
    return names;
}
