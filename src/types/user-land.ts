import { GatsbyConfig, GatsbyNode } from 'gatsby';
import { IGlobalOpts } from './index';

type ITSConfigFnTypes = 'config' | 'node';
type ITSConfigFnReturn<T extends ITSConfigFnTypes, TMergeConfigs extends IMergePluginOptions = any> = T extends 'config'
    ? IGatsbyConfiguration<TMergeConfigs>
    : GatsbyNode;

export interface ITSConfigFn<TConfigType extends ITSConfigFnTypes, TMergeConfigs extends IMergePluginOptions = any> {
    (args: IGlobalOpts): ITSConfigFnReturn<TConfigType, TMergeConfigs>;
}

/**
 * This is just an interface used to extend the default GatsbyConfig interface
 * with the additional plugin definitions
 */
export interface IGatsbyConfiguration<TPluginDefinition extends IMergePluginOptions = IMergePluginOptions> extends GatsbyConfig {
    plugins?: Array<
        | string
        | IMergePluginOptions
        | TPluginDefinition
    >;
}

/**
 * For other plugins that have types defined for their options,
 * define them using this interface, and include the definition in
 * the `exports` return type
 */
export type IMergePluginOptions<TName extends string = string, TOptions extends Record<string, unknown> = Record<string, unknown>> = {
    resolve: TName;
    options: TOptions;
}

export type IPublicOpts = Omit<IGlobalOpts, 'transformOpts'>