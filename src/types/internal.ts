import type { GatsbyConfig, GatsbyNode, GatsbyBrowser, GatsbySSR } from 'gatsby';
import type { TransformOptions } from '@babel/core';
import type { RegisterOptions as TSNodeRegisterOptions } from 'ts-node';
import type { ITSConfigFn, PublicOpts, IGatsbyPluginDef } from './public';

export type PropertyBag = Record<string, any>;
export type ValidExts = '.js' | '.ts' | '.jsx' | '.tsx';
export type RegisterType = 'ts-node' | 'babel';
export type GatsbyConfigTypes = 'config' | 'node' | 'browser' | 'ssr'
export type ConfigTypes =  GatsbyConfigTypes | 'plugin';
export type EndpointResolutionSpec = GatsbyConfigTypes | {
    type: GatsbyConfigTypes;
    ext: ValidExts[];
}

export type EndpointReturnTypes<T extends GatsbyConfigTypes = GatsbyConfigTypes> =
    T extends 'config'
        ? GatsbyConfig | ITSConfigFn<'config'>
        : T extends 'node'
            ? GatsbyNode | ITSConfigFn<'node'>
            : T extends 'browser'
                ? GatsbyBrowser
                : T extends 'ssr'
                    ? GatsbySSR
                    : unknown;

export type EndpointReturnObject<T extends GatsbyConfigTypes> =
    T extends 'config' ? GatsbyConfig
        : T extends 'node'
            ? GatsbyNode
            : T extends 'browser'
                ? GatsbyBrowser
                : T extends 'ssr'
                    ? GatsbySSR
                    : unknown;

export type InferredConfigType<T extends EndpointReturnTypes> =
    T extends GatsbyConfig | ITSConfigFn<'config'>
        ? 'config'
        : T extends GatsbyNode | ITSConfigFn<'node'>
            ? 'node'
            : T extends GatsbyBrowser
                ? 'browser'
                : T extends GatsbySSR
                    ? 'ssr'
                    : unknown;

export type PickLiteral<T, K extends T> = K extends T ? K : T;

export type GatsbyEndpointResolverMapKeys = PickLiteral<ConfigTypes, 'plugin'>;
export type GatsbyEndpointResolverKeys = Exclude<ConfigTypes, GatsbyEndpointResolverMapKeys>;

export type GatsbyEndpoints = {
    [K in GatsbyEndpointResolverKeys]?: string[];
}
export interface IGatsbyEndpointResolverMap {
    [K: string]: GatsbyEndpoints;
}
export type GatsbyResolveChain = GatsbyEndpoints & {
    [K in GatsbyEndpointResolverMapKeys]?: IGatsbyEndpointResolverMap;
};
export interface IGatsbyPluginWithOpts<
    TName extends string = string,
    TOptions extends Record<string, any> = Record<string, any>
> {
    resolve: TName;
    options?: TOptions;
}

export interface IPluginDetails {
    name: string;
    path: string;
    options: Record<string, any>;
}
export interface IPluginDetailsCallback<TReturn extends IGatsbyPluginDef = IGatsbyPluginDef> {
    (args: PublicOpts): TReturn[];
}

export type RegisterOptions<T extends RegisterType> =
    T extends 'ts-node'
        ? TSNodeRegisterOptions
        : T extends 'babel'
            ? TransformOptions
            : never;

export interface ICommonDirectories {
    projectRoot: string;
    configDir: string;
    cacheDir: string;
    pluginDir: string;
}

export interface IGlobalOpts extends ICommonDirectories {
    endpoints: GatsbyResolveChain;
    props: PropertyBag;
    babelOpts?: RegisterOptions<"babel">;
    tsNodeOpts?: RegisterOptions<"ts-node">;
}
