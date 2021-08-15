import { isGatsbyConfig } from "@util/type-util";
import { preferDefault } from "@util/node";
import { resolveFilePath } from "@util/fs-tools";

import { getPropBag } from "./options/prop-bag";
import { getApiOption, setApiOption } from "./options/api";
import { getProjectImports } from "./options/imports";
import { transpileLocalPlugins } from "./local-plugins";
import { getPluginsCache, expandPlugins } from "./include-plugins";

import type {
    ApiType,
    InitValue,
    PluginModule,
    PropertyBag,
    TSConfigFn,
    GatsbyPlugin,
    TsConfigPluginOptions,
} from "@typeDefs";
import type { Transpiler } from "./transpiler";

interface IProcessApiModuleOptions<T extends ApiType> {
    apiType: T;
    init: InitValue;
    projectName: string;
    projectRoot: string;
    options: TsConfigPluginOptions;
    propBag?: PropertyBag;
    transpiler: Transpiler;
}

export type ApiModuleProcessor = typeof processApiModule;

export const processApiModule = <
    T extends ApiType
>({
    apiType,
    init,
    projectName,
    projectRoot,
    options,
    propBag: initPropBag = {},
    transpiler,
}: IProcessApiModuleOptions<T>) => {
    const apiOptions = getApiOption(projectRoot, apiType);
    const { resolveImmediate = true } = apiOptions;

    const propBag = getPropBag(apiType, projectRoot, initPropBag);

    const resolveModuleFn = <
        C extends TSConfigFn<any>
    >(cb: C) => (
        cb(
            {
                projectRoot,
                imports: getProjectImports(projectName),
            },
            propBag,
        )
    );

    let apiModule = preferDefault(
        transpiler<T>(
            apiType,
            init,
            projectName,
            projectRoot,
        ),
    );

    let gatsbyNode: TSConfigFn<"node"> | undefined = undefined;

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
            setApiOption(projectRoot, "node", { resolveImmediate: false });
            gatsbyNode = processApiModule({
                apiType: "node",
                init: gatsbyNodePath,
                projectName,
                projectRoot,
                propBag,
                options,
                transpiler,
            }) as TSConfigFn<"node">;
            setApiOption(projectRoot, "node", {});
        }
    }


    if (typeof apiModule === "function" && resolveImmediate) {
        apiModule = resolveModuleFn(apiModule) as PluginModule<T>;
    }

    if (typeof gatsbyNode === "function") {
        resolveModuleFn(gatsbyNode);
    }

    if (!apiModule) apiModule = {};

    /**
     * Time to transpile/process local plugins
     */
    if (isGatsbyConfig(apiType, apiModule)) {
        const gatsbyConfig = apiModule as PluginModule<"config">;
        const pluginsCache = getPluginsCache(projectRoot);

        const processPlugins = (plugins: GatsbyPlugin[]) => {
            const usePlugins = expandPlugins(plugins);

            transpileLocalPlugins(
                projectName,
                projectRoot,
                options,
                processApiModule,
                propBag,
                usePlugins,
            );

            return usePlugins;
        };

        const pluginsList = gatsbyConfig.plugins = processPlugins([
            ...pluginsCache.normal,
            ...gatsbyConfig.plugins || [],
        ]);

        for (const resolver of pluginsCache.resolver) {
            const plugins = processPlugins(
                resolveModuleFn(resolver) as GatsbyPlugin[],
            );
            pluginsList.push(...plugins);
        }
    }

    return apiModule as PluginModule<T>;
};