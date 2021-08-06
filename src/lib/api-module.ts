import { keys } from "ts-transformer-keys";

import { isGatsbyConfig } from "@util/type-util";
import { preferDefault } from "@util/node";
import { resolveFilePath } from "@util/fs-tools";

import { getPropBag } from "./options";
import { getProjectImports, linkProjectPlugin } from "./imports";
import { resolveLocalPlugin } from "./local-plugins";

import type {
    ApiType,
    InitValue,
    PluginModule,
    PropertyBag,
} from "@typeDefs/internal";
import type {
    TSConfigFn,
} from "@typeDefs/public";
import type { Transpiler } from "./transpiler";

const apiTypeKeys = keys<Record<ApiType, any>>();

interface IProcessApiModuleOptions<T extends ApiType> {
    apiType: T;
    init: InitValue;
    projectName: string;
    projectRoot: string;
    propBag?: PropertyBag;
    resolveImmediate?: boolean;
    transpiler: Transpiler;
}

export const processApiModule = <
    T extends ApiType
>({
    apiType,
    init,
    projectName,
    projectRoot,
    propBag: initPropBag = {},
    resolveImmediate = false,
    transpiler,
}: IProcessApiModuleOptions<T>) => {
    const propBag = getPropBag(apiType, projectRoot, initPropBag);

    const resolveModuleFn = (cb: TSConfigFn<T>) => cb(
        {
            projectRoot,
            imports: getProjectImports(projectName),
        },
        propBag,
    );

    let apiModule = preferDefault(
        transpiler<T>(
            apiType,
            init,
            projectName,
            projectRoot,
            resolveImmediate ? resolveModuleFn : undefined,
        ),
    );

    if (apiType === "config") {
        const gatsbyNodePath = resolveFilePath(projectRoot, "./gatsby-node");

        /**
         * We want to pre-process `gatsby-node` from `gatsby-config` because:
         *
         * 1. We want to get all of the chained imports from `gatsby-node`; and,
         * 2. We want to transpile it in case it is a `.ts` file, so that Gatsby
         *    can consume it.
         */
        if (gatsbyNodePath) {
            processApiModule({
                apiType: "node",
                init: gatsbyNodePath,
                projectName,
                projectRoot,
                propBag,
                transpiler,
                resolveImmediate: true,
            });
        }
    }

    if (typeof apiModule === "function") {
        apiModule = resolveModuleFn(apiModule);
    }

    /**
     * Time to transpile/process local plugins
     */
    if (isGatsbyConfig(apiType, apiModule)) {
        apiModule?.plugins?.forEach((plugin) => {
            const localPluginName = typeof plugin === "string"
                ? plugin
                : plugin.resolve;
            if (!localPluginName) return;

            const pluginPath = resolveLocalPlugin({
                projectRoot,
                pluginName: localPluginName,
            });
            if (!pluginPath) return; // This isn't a "local" plugin

            linkProjectPlugin(projectName, localPluginName);

            apiTypeKeys.forEach((type) => {
                const gatsbyModuleName = `./gatsby-${type}`;
                const apiPath = resolveFilePath(pluginPath, gatsbyModuleName);
                if (!apiPath) return; // This `gatsby-*` file doesn't exist for this local plugin

                processApiModule({
                    apiType: type,
                    init: apiPath,
                    projectRoot: pluginPath,
                    projectName: pluginPath,
                    propBag,
                    resolveImmediate: true,
                    transpiler,
                });
            });
        });
    }

    return apiModule as PluginModule<T>;
};