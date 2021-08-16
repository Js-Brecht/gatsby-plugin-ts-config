import { promisify } from "util";
import { resolveFilePath } from "./util/fs-tools";
import _resolveBin from "resolve-bin";

const resolveBin = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        _resolveBin(path, (err, found) => {
            if (err) return reject(err);
            resolve(found);
        });
    });
};

(async () => {
    const gatsbyBin = resolveBin("gatsby");
})();