import { GatsbyConfig, GatsbyNode, PluginOptions } from 'gatsby';
import { RegisterOptions as TSNodeRegisterOptions } from 'ts-node';
import { TransformOptions } from '@babel/core';
import { IGlobalOpts } from './index';

interface ITSConfigArgsBase extends Omit<PluginOptions, 'plugins'> {
    configDir?: string;
    projectRoot?: string;
}
interface ITSConfigArgsJIT extends ITSConfigArgsBase {
    // JIT: true;
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

export interface ITSConfigFn<TConfigType extends ITSConfigFnTypes, TMergeConfigs extends IMergePluginOptions = any> {
    (args: IPublicOpts): ITSConfigFnReturn<TConfigType, TMergeConfigs>;
}

/**
 * This interface is used to extend the default GatsbyConfig interface
 * with the additional plugin definitions
 */
export interface IGatsbyConfig<TPluginDefinition extends IMergePluginOptions = IMergePluginOptions> extends GatsbyConfig {
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
