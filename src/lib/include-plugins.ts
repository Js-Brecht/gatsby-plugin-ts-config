import { getProject } from "@util/project";
import type {
    PropertyBag,
    GatsbyPlugin,
    IPluginDetailsCallback,
    IGatsbyPluginWithOpts,
} from "@typeDefs";

export interface IResolvePlugins {
    <
        T extends GatsbyPlugin = GatsbyPlugin,
        P extends PropertyBag = PropertyBag,
    >(plugins: T[] | IPluginDetailsCallback<T, P>): void;
    <
        T extends GatsbyPlugin = GatsbyPlugin,
        P extends PropertyBag = PropertyBag,
    >(plugins: T[], pluginsCb?: IPluginDetailsCallback<T, P>): void;
}

type PluginCache = {
    [project: string]: {
        normal: IGatsbyPluginWithOpts[];
        resolver: IPluginDetailsCallback[];
    }
}

const pluginCache: PluginCache = {};

export const expandPlugins = (plugins: GatsbyPlugin[]): IGatsbyPluginWithOpts[] => (
    plugins
        .filter(Boolean)
        .map((p) => (
            typeof p === "string"
                ? { resolve: p, options: {} }
                : p
        )) as IGatsbyPluginWithOpts[]
);

const wrapPluginResolver = (resolver: IPluginDetailsCallback) => (
    (...args: Parameters<IPluginDetailsCallback>) => (
        expandPlugins(resolver(...args))
    )
);

/**
 * Registers and processes plugins that will be provided to Gatsby when your site's
 * `gatsby-plugin` is read.
 *
 * * Provides strong typing for plugin array/callback functions
 *
 * Can be used with two generic type parameters,
 *
 * * `PluginDefinitions` - Should be a union of various plugin declaration types,
 *   in the format:
 *
 *   ```
 *   string | {
 *     resolve: string;
 *     options: Record<string, any> | PluginOptions
 *   }
 *   ```
 *
 *  * `Props` - Defines the structure of the second parameter of the callback
 *    parameter type
 *
 * @example
 *
 * ```ts
 * type PluginDefinitions = (
 *   | GatsbyPlugin<'foo', IFooPluginOptions>
 *   | 'bar'
 *   | { resolve: 'bar'; options: { qux: number }; }
 * )
 *
 * type PropertyBag = {
 *   random: string;
 *   properties: number[];
 * }
 *
 * includePlugins<PluginDefinitions, PropertyBag>(
 *   arrayOfPlugins,
 *   ({ projectRoot }, {random, properties}) => {
 *     // Build plugin array
 *   })
 * );
 * ```
 *
 * @param {GatsbyPlugin[] | IPluginDetailsCallback} plugins - Can be either
 * a plugin array, or a callback function.  The callback function receives
 * the same parameters as the `gatsby-config` or `gatsby-node` default export
 * functions.  The plugin array must be in the same format that Gatsby itself
 * receives.
 *
 * @param {IPluginDetailsCallback} cb - (Optional) This second parameter can
 * only be a callback function.
 *
 * @remarks
 * * `cb`:
 *
 *   `(args: PublicOpts, props: PropertyBag) => GatsbyPlugin[]`
 *   * `PublicOpts` - A collection of options/parameters that provide context
 *     based on the runtime of this plugin
 *   * `PropertyBag` - A collection of properties passed down from props option in
 *     the original definition of this plugin.
 *
 * * Plugin ordering:
 *
 *   Plugins registered this way change the order that plugin's are included in the
 *   array fed to Gatsby.  This will effect the order they are called, so you must
 *   be aware of it.  They will be included in this order:
 *
 *   1. Array form of the first parameter of this function
 *   2. Normal `gatsby-config` plugin array
 *   3. Plugins returned from the callback function parameter(s) in this function
 */
export const includePlugins: IResolvePlugins = <
    T extends GatsbyPlugin = GatsbyPlugin,
    P extends PropertyBag = PropertyBag,
>(
    plugins: T[] | IPluginDetailsCallback<T>,
    pluginsCb?: IPluginDetailsCallback<T, P>,
) => {
    const { projectRoot } = getProject();
    const cache = pluginCache[projectRoot] = (
        pluginCache[projectRoot] || {
            normal: [],
            resolver: [],
        }
    );

    if (plugins instanceof Array) {
        cache.normal.push(...expandPlugins(plugins));
    } else {
        pluginsCb = plugins;
    }

    if (pluginsCb) {
        cache.resolver.push(
            wrapPluginResolver(pluginsCb as unknown as IPluginDetailsCallback),
        );
    }
};

export const getPluginsCache = (projectRoot: string) => (
    pluginCache[projectRoot] || {
        normal: [],
        resolver: [],
    }
);