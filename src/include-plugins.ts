import { Project } from "@lib/project";
import { getPluginsCache } from "@lib/process-plugins";

import { getProject } from "@util/project-meta";
import { PluginError, getDebugLogger } from "@util/output";

import type {
    PropertyBag,
    GatsbyPlugin,
    IPluginDetailsCallback,
    IGatsbyPluginWithOpts,
    // GatsbyTsOptions,
} from "@typeDefs";

/**
 * Allows you to generate a strongly typed Gatsby plugin spec array, but defers the resolution of the
 * callback until after the rest of the current project's modules have been processed completely.
 *
 * Since some of the properties passed to the meta functions depends on what modules have been transpiled
 * and what plugins have already been loaded, the callback you define this way will be receiving the most
 * up-to-date information.
 *
 * Plugins defined this way will be appened to the array that is provided to Gatsby.
 *
 * @param {IPluginDetailsCallback} pluginsCb- The callback function receives the same parameters as the
 * `ProjectMetaCb` functions.  It must return an array of plugins that Gatsby is able to comprehend.
 */
export const loadPluginsDeferred = <
    T extends GatsbyPlugin = GatsbyPlugin,
    P extends PropertyBag = PropertyBag,
>(
    pluginsCb: IPluginDetailsCallback<T, P>,
) => {
    const { projectRoot } = getProject();
    const cache = getPluginsCache(projectRoot);

    if (pluginsCb) {
        cache.resolver.push(
            pluginsCb as unknown as IPluginDetailsCallback,
        );
    }
};

// type GetPluginOpts = TsConfigPluginOptions;

export type LoadPluginFn<
    P1 extends PropertyBag = PropertyBag,
> = <
    TPlugins extends GatsbyPlugin = GatsbyPlugin,
    P2 extends PropertyBag = P1,
>(
    plugins: TPlugins[] | IPluginDetailsCallback<TPlugins, P2>,
    // opts?: GetPluginOpts,
) => IGatsbyPluginWithOpts[]

/**
 * Immediately processes a collection of plugins or a plugin resolver function, and returns the array for
 * Gatsby's consumption
 *
 * All plugins passed to this function will be transpiled immediately.
 */
export const loadPlugins: LoadPluginFn = (
    plugins,
    // opts,
) => {
    const project = Project.getProject(
        {
            apiType: "config",
            // options: opts,
        },
        false,
        undefined,
        getDebugLogger("loadPlugins"),
    );

    try {
        return project.processPlugins(
            "all",
            plugins,
        );
    } catch (err: any) {
        throw new PluginError(err);
    }
};