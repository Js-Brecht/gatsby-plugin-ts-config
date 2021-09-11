import path from "path";
import { IgnoreFn, IgnoreHookFn } from "@typeDefs";

const slash = (p: string) => (
    p.endsWith(path.sep) ? p : p + path.sep
);

const ignoreRules: IgnoreFn[] = [
    // Module must not be a node_modules dependency
    (fname) => /node_modules/.test(fname),
];

const rulesWillIgnore = (
    filePath: string,
    existing: boolean,
    rules = ignoreRules as (IgnoreFn | IgnoreHookFn)[],
) => rules.some((rule) => rule(filePath, existing));

const prohibitDirs = [
    // Don't ever want to hit stuff in <project>/public
    "public",
    // Don't ever want to hit stuff in <project>/.cache, either
    ".cache",
    // Do not process nested node_modules at all
    "node_modules",
];

class AllowedFilesImpl {
    private allowedDirs: string[] = [];
    private prohibitDirs: string[][] = [];

    public get len(): number {
        return this.allowedDirs.length - 1;
    }

    public addDir(dir: string) {
        this.allowedDirs.push(slash(dir));
        this.prohibitDirs.push(prohibitDirs.map((p) => (
            slash(path.join(dir, p))
        )));
    }
    public removeDir(dir: string) {
        const len = this.len;
        this.allowedDirs.forEach((_, i) => {
            const idx = len - i;
            const cur = this.allowedDirs[idx];
            if (cur === dir) {
                this.allowedDirs.splice(idx, 1);
                this.prohibitDirs.splice(idx, 1);
            }
        });
    }

    private isIgnored(filePath: string) {
        for (const [idx, cur] of this.allowedDirs.entries()) {
            const prohibitedDirs = this.prohibitDirs[idx] || [];
            const isProhibited = prohibitedDirs.some((prohibit) => (
                filePath.startsWith(prohibit)
            ));

            if (isProhibited) return true;

            const isNodeModules = filePath.indexOf("node_modules") > -1;

            const isTsModule = (
                path.extname(filePath).startsWith(".ts")
            );

            const isInAllowedDir = filePath.startsWith(cur);

            if (isInAllowedDir) {
                // Directory is allowed, and it's not inside node_modules... do not ignore
                if (!isNodeModules) return false;

                // Module is in node_modules... since this package is marked as "allowed", allow
                // transpiling `.ts` files only
                if (isNodeModules && isTsModule) return false;
            }
        }

        // Process normal ignore rules
        return rulesWillIgnore(filePath, false);
    }

    public ignored(filePath: string, ignoreHooks?: IgnoreHookFn[]) {
        const ignore = this.isIgnored(filePath);
        if (ignoreHooks) {
            return rulesWillIgnore(filePath, ignore, ignoreHooks);
        }
        return ignore;
    }
}

export const AllowedFiles = new AllowedFilesImpl();