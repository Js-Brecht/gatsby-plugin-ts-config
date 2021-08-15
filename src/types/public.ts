import type {
    ApiType,
    RootPluginImports,
    PropertyBag,
    PluginModule,
} from "./internal";

/**
 * Options passed in the first parameter of a `gatsby-*` default export,
 * if one is defined and it is a function.
 */
export interface PublicOpts {
    imports: RootPluginImports;
    projectRoot?: string;
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