import path from "path";
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

export const resolvePlugin = (
    relativeTo: string,
    pluginName: string,
    localOnly: boolean,
): string => {
    const scopedRequire = createRequire(`${relativeTo}/:internal:`);
    try {
        const pluginPath = path.dirname(
            scopedRequire.resolve(`${pluginName}/package.json`),
        );
        return localOnly ? "" : pluginPath;
    } catch (err) {
        const pluginDir = path.resolve(relativeTo, "plugins", pluginName);
        const pkgJson = getFile(
            path.join(pluginDir, "package.json"),
        );

        if (pkgJson && pkgJson.isFile()) {
            return pluginDir;
        }

        return "";
    }
};

export const transpilePlugins = (
    projectName: string,
    projectRoot: string,
    options: TsConfigPluginOptions,
    type: "local-only" | "all",
    processApiModule: ApiModuleProcessor,
    propBag?: PropertyBag,
    plugins = [] as IGatsbyPluginWithOpts[],
) => {
    plugins.forEach((plugin) => {
        const localPluginName = plugin.resolve;
        if (!localPluginName) return;

        const pluginPath = resolvePlugin(
            projectRoot,
            localPluginName,
            type === "local-only",
        );
        if (!pluginPath) return; // We shouldn't transpile this plugin

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