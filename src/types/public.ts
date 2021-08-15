import type {
    ApiType,
    RootPluginImports,
    PropertyBag,
    PluginModule,
    IGatsbyPluginWithOpts,
} from "./internal";

/**
 * Options passed in the first parameter of a `gatsby-*` default export,
 * if one is defined and it is a function.
 */
export interface PublicOpts {
    imports: RootPluginImports;
    projectRoot: string;
}

/**
 * This interface can be used to define the function-style default
 * export of `gatsby-config` or `gatsby-node`
 *
 * @param {ApiType} TConfigType - What type of function this represents:
 *
 * * `config`
 * * `node`
 *
 * @param {JsonObject} TProps - Defines the second parameter of the function,
 * which represents an arbitrary property bag as defined by the plugin definition in
 * the original gatsby plugin array
 *
 * @example
 * ```ts
 * const gatsbyNode: ITSConfigFn<'node'> = (args) => ({
 *      sourceNodes: ({ actions }) => {
 *         ...
 *      }
 * });
 * export default gatsbyNode;
 * ```
 *
 * @example
 * ```ts
 * const gatsbyConfig: ITSConfigFn<'config', {}> = (args, props) => ({
 *      plugins: [
 *          ...
 *      ]
 * });
 * export default gatsbyConfig;
 * ```
 */
export type TSConfigFn<
    TConfigType extends ApiType,
    TProps extends PropertyBag = PropertyBag
> = {
    (args: PublicOpts, props: TProps): PluginModule<TConfigType>;
}

/**
 * This interface can be used with the `includePlugins` utility function
 * to ensure that the options provided for any defined plugins are
 * strongly typed.
 *
 * @param {string} TName - a string literal that represents the plugin name
 * @param {object} TOptions - (optional) the possible options for the defined
 * plugin
 *
 * @example
 * ```ts
 *  interface IBarPluginOptions {
 *      barOption: 'qux';
 *  }
 *
 *  includePlugins<
 *      | GatsbyPlugin<'fooPlugin'>
 *      | GatsbyPlugin<'barPlugin', IBarPluginOptions>
 *  >([
 *      // These strings will be strongly typed
 *      'fooPlugin',
 *
 *      // This object will be strongly typed
 *      {
 *          resolve: 'barPlugin',
 *          options: {
 *              barOption: 'qux',
 *          }
 *      }
 *  ])
 * ```
 *
 * @remarks
 * If a plugin provides its own options interface in the form of
 *
 * ```ts
 *  interface IFooPluginOptions {
 *      resolve: 'fooPlugin';
 *      options: {
 *          fooOption: 'bar';
 *      }
 *  }
 * ```
 *
 * It may be used in the place of an `GatsbyPlugin` definition
 */
export type GatsbyPlugin<TName extends string = string, TOptions extends Record<string, any> = Record<string, any>> = (
    | TName
    | IGatsbyPluginWithOpts<TName, TOptions>
    | false
)