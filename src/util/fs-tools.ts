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

const moduleResolver = resolve.create.sync({
    extensions: [".js", ".ts"],
});

export const resolveFilePath = (startDir: string, moduleName: string): false | string => {
    try {
        return moduleResolver(startDir, moduleName);
    } catch (err) {
        return false;
    }
};