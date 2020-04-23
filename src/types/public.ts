import { GatsbyConfig, GatsbyNode } from 'gatsby';
import { RegisterOptions as TSNodeRegisterOptions } from 'ts-node';
import { TransformOptions } from '@babel/core';
import { IGlobalOpts, IRegisterHooks } from './internal';

interface ITSConfigArgsBase {
    configDir?: string;
    projectRoot?: string;
}
interface ITSConfigArgsJIT extends ITSConfigArgsBase {
    // JIT: true;
    hooks?: IRegisterHooks;
    babel?: TransformOptions | boolean;
    tsNode?: TSNodeRegisterOptions | boolean;
}
// interface ITSConfigArgsAOT extends ITSConfigArgsBase {
//     JIT?: false;
//     babel: TransformOptions | true;
// }
export interface ITSConfigArgs extends ITSConfigArgsJIT /* | ITSConfigArgsAOT */ {}

export type IPublicOpts = Omit<IGlobalOpts, 'transformOpts' | 'pluginDir'>

type ITSConfigFnTypes = 'config' | 'node';
type ITSConfigFnReturn<T extends ITSConfigFnTypes, TMergeConfigs extends IMergePluginOptions = any> = T extends 'config'
    ? IGatsbyConfig<TMergeConfigs>
    : GatsbyNode;

/**
 * This interface can be used to define the function-style default
 * export of `gatsby-config` or `gatsby-node`
 *
 * @example
 * ```ts
 * const gatsbyNode: ITSConfigFn<'node'> = () => ({
 *      sourceNodes: ({ actions }) => {
 *         ...
 *      }
 * });
 * export default gatsbyNode;
 * ```
 *
 * @example
 * ```ts
 * const gatsbyConfig: ITSConfigFn<'config', FooPluginOptions> = () => ({
 *      plugins: [
 *          ...
 *      ]
 * });
 * export default gatsbyConfig;
 * ```
 */
export interface ITSConfigFn<TConfigType extends ITSConfigFnTypes, TMergeConfigs extends IMergePluginOptions = any> {
    (args: IPublicOpts): ITSConfigFnReturn<TConfigType, TMergeConfigs>;
}

/**
 * For plugins that have types defined for their options,
 * but don't include the requisite GatsbyConfig structure (i.e. includes
 * both the `resolve` & `options` properties), you can define them using
 * this interface, and include them in the `ITSConfigFn` type definition
 * as a union in the second parameter
 *
 * @example
 * ```ts
 * const gatsbyConfig: ITSConfigFn<'config',
 *      IMergePluginOptions<'gatsby-plugin-foo', FooPluginOptions>
 * > = () => ({
 *      plugins: [
 *          ...
 *      ]
 * })
 * ```
 */
export type IMergePluginOptions<
    TName extends string = string,
    TOptions extends object = {},
> = {
    resolve: TName;
    options: TOptions;
}

type DefaultPluginDef = IMergePluginOptions<string, Record<string, unknown>>;

/**
 * This interface is used to extend the default GatsbyConfig interface
 * with the additional plugin definitions
 */
export interface IGatsbyConfig<TPluginDefinition extends IMergePluginOptions = IMergePluginOptions> extends GatsbyConfig {
    plugins?: Array<
        | string
        | DefaultPluginDef
        | TPluginDefinition
    >;
}
