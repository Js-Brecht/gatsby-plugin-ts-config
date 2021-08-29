import path from "path";
import { getFile, resolveFilePath } from "@util/fs-tools";
import { createRequire } from "@util/node";
import { apiTypeKeys } from "@util/constants";

import { Project } from "@lib/project";

import type { PackageJson } from "type-fest";
import type {
    IGatsbyPluginWithOpts,
} from "@typeDefs";
import type { ApiModuleProcessor } from "./api-module";

type ResolvePluginResult = {
    path: string;
    pkgJson: PackageJson;
}

export const resolvePlugin = (
    relativeTo: string,
    pluginName: string,
    localOnly: boolean,
): ResolvePluginResult | void => {
    const scopedRequire = createRequire(`${relativeTo}/:internal:`);
    try {
        const pluginPath = path.dirname(
            scopedRequire.resolve(`${pluginName}/package.json`),
        );
        return localOnly ? void 0 : {
            path: pluginPath,
            pkgJson: require(`${pluginPath}/package.json`),
        };
    } catch (err) {
        const pluginDir = path.resolve(relativeTo, "plugins", pluginName);
        const pkgJsonPath = path.join(pluginDir, "package.json");
        const pkgJson = getFile(pkgJsonPath);

        if (pkgJson && pkgJson.isFile()) {
            return {
                path: pluginDir,
                pkgJson: require(pkgJsonPath),
            };
        }

        return;
    }
};

export type PluginTranspileType = "all" | "local-only" | "none";

export const transpilePlugins = (
    project: Project,
    type: PluginTranspileType,
    processApiModule: ApiModuleProcessor,
    plugins = [] as IGatsbyPluginWithOpts[],
) => {
    if (type === "none") return;
    plugins.forEach((plugin) => {
        const pluginName = plugin.resolve;
        if (!pluginName) return;

        const {
            projectRoot,
        } = project.projectMeta;

        const pluginDetails = resolvePlugin(
            projectRoot,
            pluginName,
            type === "local-only",
        );
        if (!pluginDetails) return; // We shouldn't transpile this plugin

        const {
            path: pluginPath,
            pkgJson,
        } = pluginDetails;

        project.linkPluginImports(pluginName);

        apiTypeKeys.forEach((type) => {
            const gatsbyModuleName = `./gatsby-${type}.ts`;
            const apiPath = resolveFilePath(pluginPath, gatsbyModuleName);
            if (!apiPath) return; // This `gatsby-*` file doesn't exist for this local plugin

            processApiModule({
                apiType: type,
                init: apiPath,
                project: Project.getProject({
                    apiType: type,
                    projectMeta: {
                        projectRoot: pluginPath,
                        projectName: pluginName,
                        pkgJson,
                    },
                    options: project.options,
                    propBag: project.propBag,
                }),
                resolveApi: type === "node",
            });
        });
    });
};