import path from "path";

export class AllowedDirs {
    private static allowedDirs: string[] = [];

    public static get len(): number {
        return AllowedDirs.allowedDirs.length - 1;
    }

    public static add(dir: string) {
        AllowedDirs.allowedDirs.push(dir);
    }
    public static remove(dir: string) {
        const len = AllowedDirs.len;
        AllowedDirs.allowedDirs.forEach((_, i) => {
            const idx = len - i;
            const cur = AllowedDirs.allowedDirs[idx];
            if (cur === dir) {
                AllowedDirs.allowedDirs.splice(idx, 1);
            }
        });
    }
    public static allowed(dir: string) {
        return AllowedDirs.allowedDirs.some((cur) => (
            dir.startsWith(cur + path.sep)
        ));
    }
}