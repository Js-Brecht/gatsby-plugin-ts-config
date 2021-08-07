import { GatsbyConfig, GatsbyNode } from 'gatsby';
import { RegisterOptions as TSNodeRegisterOptions } from 'ts-node';
import { TransformOptions } from '@babel/core';
import {
    IGlobalOpts,
    PickLiteral,
    GatsbyConfigTypes,
    IGatsbyPluginWithOpts,
    PropertyBag,
} from './internal';


export interface ITSConfigPluginOptions {
    configDir?: string;
    projectRoot?: string;
    props?: PropertyBag;
    babel?: TransformOptions | boolean;
    tsNode?: TSNodeRegisterOptions | boolean;
}
export type TSConfigSetupOptions = Omit<ITSConfigPluginOptions, "props">;

export type PublicOpts = Pick<IGlobalOpts,
    | 'endpoints'
    | 'projectRoot'
    | 'configDir'
    | 'cacheDir'
>

type ITSConfigFnTypes = PickLiteral<GatsbyConfigTypes, 'config' | 'node'>;
type ITSConfigFnReturn<T extends ITSConfigFnTypes> = T extends 'config'
    ? GatsbyConfig
    : GatsbyNode;

/**
 * This interface can be used to define the function-style default
 * export of `gatsby-config` or `gatsby-node`
 *
 * @param {string} TConfigType - What type of function this represents:
 *
 * * `config`
 * * `node`
 *
 * @param {Record<string, any>} TProps - Defines the second parameter of the function,
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
export interface ITSConfigFn<
    TConfigType extends ITSConfigFnTypes,
    TProps extends PropertyBag = PropertyBag
> {
    (args: PublicOpts, props: TProps): ITSConfigFnReturn<TConfigType>;
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
 *      | IGatsbyPluginDef<'fooPlugin'>
 *      | IGatsbyPluginDef<'barPlugin', IBarPluginOptions>
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
 * It may be used in the place of an `IGatsbyPluginDef` definition
 */
export type IGatsbyPluginDef<TName extends string = string, TOptions extends Record<string, any> = Record<string, any>> = (
    | TName
    | IGatsbyPluginWithOpts<TName, TOptions>
    | false
)