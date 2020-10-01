import OptionsHandler from './utils/options-handler';

import type { GatsbyConfig } from 'gatsby';
import type { TSConfigSetupOptions, PropertyBag } from './types';

type GeneratedGatsbyConfig = Pick<GatsbyConfig, 'plugins'>;
interface IGenerateConfig {
    (args: TSConfigSetupOptions, props: PropertyBag): GeneratedGatsbyConfig;
}

export const generateConfig: IGenerateConfig = (options, props) => {
    return {
        plugins: [
            {
                resolve: `gatsby-plugin-ts-config`,
                options: {
                    ...(options as Record<string, any>),
                    props,
                },
            },
        ],
    };
};

/**
 * Registers and processes plugins that will be provided to Gatsby when your site's
 * `gatsby-plugin` is read.
 *
 * * Resolves paths of each plugin relative to your default site's working directory
 * * Looks for plugins in the local `plugins` directory, as well as `node_modules`
 * * Compiles plugin endpoints that are written in Typescript
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
 * includePlugins<(
 *     // Plugin Definitions
 *     | IGatsbyPluginDef<'foo', IFooPluginOptions>
 *     | 'bar'
 *     | { resolve: 'bar'; options: { qux: number }; }
 *   ),
 *
 *   // Property Bag
 *   {
 *     random: string;
 *     properties: number[];
 *   }
 * >(arrayOfPlugins, ({ projectRoot }, {random, properties}) => {
 *   // do something
 * })
 * ```
 *
 * @param {IGatsbyPluginDef[] | IPluginDetailsCallback} plugins - Can be either
 * a plugin array, or a callback function.  The callback function receives
 * the same parameters as the `gatsby-config` or `gatsby-node` default export
 * functions.  The plugin array must be in the same format that Gatsby itself
 * receives.
 *
 * @param {IPluginDetailsCallback} cb - (Optional) This second parameter can
 * only be a callback function.
 *
 * @remarks
 * * `IPluginDetailsCallback`:
 *
 *   `(args: PublicOpts, props: PropertyBag) => GatsbyPluginDef[]`
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
export const includePlugins = OptionsHandler.includePlugins;

export * from './types/public';