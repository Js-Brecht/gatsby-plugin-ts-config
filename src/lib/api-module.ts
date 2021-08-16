import set from "lodash/set";
import get from "lodash/get";
import has from "lodash/has";
import merge from "lodash/merge";

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

type ResolvedModuleCache = {
    [project: string]: {
        [api in ApiType]?: PluginModule<any>;
    }
}

const resolvedModuleCache: ResolvedModuleCache = {};

const updateModuleCache = <TModule>(
    cachePath: readonly [string, ApiType],
    mod: TModule,
    extendPath = [] as string[],
) => {
    if (has(resolvedModuleCache, cachePath)) {
        const extendObj = {};
        set(extendObj, extendPath, mod);
        mod = merge(
            get(resolvedModuleCache, cachePath, mod),
            extendObj,
        ) as unknown as TModule;
    }
    set(resolvedModuleCache, cachePath, mod);
    return mod;
};

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

    const cachePath = [projectRoot, apiType] as const;

    // If a module has been fully resolved, we only need to process it once
    const cachedResolve = (
        get(resolvedModuleCache, cachePath)
    ) as PluginModule<T> | undefined;
    if (cachedResolve) return cachedResolve;

    const apiOptions = getApiOption(projectRoot, apiType);
    const { resolveImmediate = true } = apiOptions;

    const propBag = getPropBag(apiType, projectRoot, initPropBag);

    const resolveModuleFn = <
        C extends TSConfigFn<any>
    >(cb: C): ReturnType<C> => {
        const resolved = cb(
            {
                projectRoot,
                imports: getProjectImports(projectName),
            },
            propBag,
        );
        return resolved as ReturnType<C>;
    };

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
        const gatsbyNodePath = resolveFilePath.sync(projectRoot, "./gatsby-node");

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
        apiModule = resolveModuleFn(apiModule);
    }

    if (typeof gatsbyNode === "function") {
        /**
         * If we're processing `gatsby-config`, then we requested
         * that `gatsby-node` be processed too, but that any returned
         * function NOT be resolved immediately.  That means that THIS
         * run needs to resolve and cache it.
         *
         * Because the initial run didn't resolve the function (after
         * require()), this means the require.cache has a function for
         * an export.
         *
         * Resolving it now means that we are mutating require.cache
         * too
         */
        updateModuleCache(
            [projectRoot, "node"],
            resolveModuleFn(gatsbyNode),
        );
    }

    if (!apiModule) apiModule = {};

    if (typeof apiModule === "object" && resolveImmediate) {
        /**
         * During processing of this api-module, it could have been
         * processed already.  This can happen if bootstrap functions
         * are stacked...
         *
         * e.g. `gatsby-ts` cli was used, and the root `gatsby-config.js`
         * is using `useGatsbyConfig`...
         *
         * They will be calling the same function, and we don't want to run
         * the bootstrap more than once, so we exit early here.
         */
        const cached = get(resolvedModuleCache, cachePath);
        if (cached) return cached;

        updateModuleCache(cachePath, apiModule);
    }

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
                resolveModuleFn(resolver),
            );
            pluginsList.push(...plugins);
        }

        // Replace cached module plugins array
        updateModuleCache(cachePath, pluginsList, ["plugins"]);
    }

    return apiModule as PluginModule<T>;
};