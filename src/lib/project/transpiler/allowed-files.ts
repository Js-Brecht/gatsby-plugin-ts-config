import path from "path";

const slash = (p: string) => (
    p.endsWith(path.sep) ? p : p + path.sep
);

export class AllowedFiles {
    private static allowedDirs: string[] = [];

    public static get len(): number {
        return AllowedFiles.allowedDirs.length - 1;
    }

    public static addDir(dir: string) {
        AllowedFiles.allowedDirs.push(slash(dir));
    }
    public static removeDir(dir: string) {
        const len = AllowedFiles.len;
        AllowedFiles.allowedDirs.forEach((_, i) => {
            const idx = len - i;
            const cur = AllowedFiles.allowedDirs[idx];
            if (cur === dir) {
                AllowedFiles.allowedDirs.splice(idx, 1);
            }
        });
    }

    public static allowed(filePath: string) {
        for (const cur of AllowedFiles.allowedDirs) {
            const isNodeModules = filePath.indexOf("node_modules") > -1;

            const isTsInNodeModules = (
                isNodeModules &&
                path.extname(filePath).startsWith(".ts")
            );

            const isInAllowedDir = filePath.startsWith(cur);

            if (isInAllowedDir) {
                if (!isNodeModules) return true;
                if (isNodeModules && isTsInNodeModules) return true;
            }
        }
    }
}