import fs from "fs-extra";

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