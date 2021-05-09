import path from "path";
import fs from "fs-extra";
import { getFile } from "@util/fs-tools";
import { createRequire } from "@util/node";

interface IResolvePluginPathProps {
    projectRoot: string;
    pluginName: string;
}

export const resolveLocalPlugin = ({
    projectRoot,
    pluginName,
}: IResolvePluginPathProps): string => {
    const scopedRequire = createRequire(`${projectRoot}/:internal:`);
    try {
        scopedRequire.resolve(`${pluginName}/package.json`);
        return "";
    } catch (err) {
        const pluginDir = path.resolve(projectRoot, "plugins", pluginName);

        if (
            fs.pathExistsSync(pluginDir) &&
            fs.statSync(pluginDir).isDirectory()
        ) {
            const pkgJson = getFile(
                path.join(pluginDir, "package.json"),
            );
            if (pkgJson && pkgJson.isFile()) {
                return pluginDir;
            }
        }
        return "";
    }
};
