import path from "path";
import fs from "fs-extra";
import { getFile, resolveFilePath } from "@util/fs-tools";
import { createRequire } from "@util/node";
import { apiTypeKeys } from "@util/constants";

import { linkProjectPlugin } from "./options/imports";
import { getTranspiler } from "./transpiler";

import type {
    PropertyBag,
    TsConfigPluginOptions,
    IGatsbyPluginWithOpts,
} from "@typeDefs";
import type { ApiModuleProcessor } from "./api-module";

export const resolveLocalPlugin = (
    relativeTo: string,
    pluginName: string,
): string => {
    const scopedRequire = createRequire(`${relativeTo}/:internal:`);
    try {
        scopedRequire.resolve(`${pluginName}/package.json`);
        return "";
    } catch (err) {
        const pluginDir = path.resolve(relativeTo, "plugins", pluginName);

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

export const transpileLocalPlugins = (
    projectName: string,
    projectRoot: string,
    options: TsConfigPluginOptions,
    processApiModule: ApiModuleProcessor,
    propBag?: PropertyBag,
    plugins = [] as IGatsbyPluginWithOpts[],
) => {
    plugins.forEach((plugin) => {
        const localPluginName = plugin.resolve;
        if (!localPluginName) return;

        const pluginPath = resolveLocalPlugin(
            projectRoot,
            localPluginName,
        );
        if (!pluginPath) return; // This isn't a "local" plugin

        linkProjectPlugin(projectName, localPluginName);

        const transpiler = getTranspiler(
            projectRoot,
            options,
        );

        apiTypeKeys.forEach((type) => {
            const gatsbyModuleName = `./gatsby-${type}`;
            const apiPath = resolveFilePath(pluginPath, gatsbyModuleName);
            if (!apiPath) return; // This `gatsby-*` file doesn't exist for this local plugin

            processApiModule({
                apiType: type,
                init: apiPath,
                projectRoot: pluginPath,
                projectName: localPluginName,
                propBag,
                options,
                transpiler,
            });
        });
    });
};