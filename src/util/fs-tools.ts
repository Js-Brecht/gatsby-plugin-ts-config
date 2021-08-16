import fs from "fs-extra";
import resolve from "enhanced-resolve";

export const fileExists = (fPath: string): fs.Stats | void => {
    try {
        const fStats = fs.statSync(fPath);
        if (fStats) return fStats;
    } catch (err) {
        // noop
    }
};

export const getFile: typeof fileExists = (fpath) => (
    fileExists(fpath)
);

export const extensions = [".ts", ".tsx", ".js", ".jsx"] as const;

const resolveModuleSync = resolve.create.sync({
    extensions,
});
const resolveModuleAsync = resolve.create({
    extensions,
});

type FilePathRet = false | string;
type FilePathResolver<TReturn = Promise<FilePathRet>> = (startDir: string, moduleName: string) => TReturn;

interface IResolveFilePath extends FilePathResolver {
    sync: FilePathResolver<FilePathRet>;
}

export const resolveFilePath: IResolveFilePath = (startDir, moduleName) => {
    return new Promise<FilePathRet>((resolve) => {
        resolveModuleAsync(startDir, moduleName, (err: Error | string, found?: string) => {
            if (err || !found) return resolve(false);
            resolve(found);
        });
    });
};

resolveFilePath.sync = (startDir, moduleName) => {
    try {
        return resolveModuleSync(startDir, moduleName);
    } catch (err) {
        return false;
    }
};