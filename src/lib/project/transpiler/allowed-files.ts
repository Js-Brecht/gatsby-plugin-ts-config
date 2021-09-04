import path from "path";

const slash = (p: string) => (
    p.endsWith(path.sep) ? p : p + path.sep
);

class AllowedFilesImpl {
    private allowedDirs: string[] = [];

    public get len(): number {
        return this.allowedDirs.length - 1;
    }

    public addDir(dir: string) {
        this.allowedDirs.push(slash(dir));
    }
    public removeDir(dir: string) {
        const len = this.len;
        this.allowedDirs.forEach((_, i) => {
            const idx = len - i;
            const cur = this.allowedDirs[idx];
            if (cur === dir) {
                this.allowedDirs.splice(idx, 1);
            }
        });
    }

    public allowed(filePath: string) {
        for (const cur of this.allowedDirs) {
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

export const AllowedFiles = new AllowedFilesImpl();