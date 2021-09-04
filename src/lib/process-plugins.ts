import { Project } from "@lib/project";
import { transpilePlugins, PluginTranspileType } from "./plugin-transpiler";

import type { ApiModuleProcessor } from "./api-module";
import type {
    PropertyBag,
    GatsbyPlugin,
    IPluginDetailsCallback,
    IGatsbyPluginWithOpts,
} from "@typeDefs";

export type { PluginTranspileType };

export interface IResolvePlugins<TReturn = void> {
    <
        T extends GatsbyPlugin = GatsbyPlugin,
        P extends PropertyBag = PropertyBag,
    >(plugins: T[] | IPluginDetailsCallback<T, P>): TReturn;
    <
        T extends GatsbyPlugin = GatsbyPlugin,
        P extends PropertyBag = PropertyBag,
    >(plugins: T[], pluginsCb?: IPluginDetailsCallback<T, P>): TReturn;
}

type PluginCache = {
    [project: string]: {
        normal: IGatsbyPluginWithOpts[];
        resolver: IPluginDetailsCallback[];
    }
}

const pluginCache: PluginCache = {};

export const expandPlugins = (
    plugins: GatsbyPlugin[],
): IGatsbyPluginWithOpts[] => (
    plugins
        .filter(Boolean)
        .map((p) => (
            typeof p === "string"
                ? { resolve: p, options: {} }
                : p
        )) as IGatsbyPluginWithOpts[]
);

export const processPlugins = <
    T extends GatsbyPlugin = GatsbyPlugin,
    P extends PropertyBag = PropertyBag,
>(
    plugins = [] as (T | IPluginDetailsCallback<T, P>)[],
    project: Project,
    apiModuleProcessor: ApiModuleProcessor,
    transpileType: PluginTranspileType,
): IGatsbyPluginWithOpts[] => {
    const usePlugins = expandPlugins(plugins.reduce((arr, pluginSet) => {
        if (typeof pluginSet === "function") {
            return arr.concat(
                project.resolveConfigFn(
                    pluginSet as IPluginDetailsCallback<any, any>,
                ) as GatsbyPlugin[],
            );
        }
        arr.push(pluginSet);
        return arr;
    }, [] as GatsbyPlugin[]));

    transpilePlugins(
        project,
        transpileType,
        apiModuleProcessor,
        usePlugins,
    );

    return usePlugins;
};

export const processPluginCache = (
    project: Project,
    apiModuleProcessor: ApiModuleProcessor,
    insertPlugins = [] as GatsbyPlugin[],
) => {
    const doProcessPlugins = (
        plugins = [] as (GatsbyPlugin | IPluginDetailsCallback)[],
        allPlugins: boolean,
    ) => (
        processPlugins(
            plugins,
            project,
            apiModuleProcessor,
            allPlugins ? "all" : "local-only",
        )
    );

    const pluginCache = getPluginsCache(project.projectRoot);
    return [
        ...doProcessPlugins(pluginCache.normal, true),
        ...doProcessPlugins(insertPlugins, false),
        ...doProcessPlugins(pluginCache.resolver, true),
    ];
};


export const getPluginsCache = (projectRoot: string) => (
    pluginCache[projectRoot] = (
        pluginCache[projectRoot] || {
            normal: [],
            resolver: [],
        }
    )
);