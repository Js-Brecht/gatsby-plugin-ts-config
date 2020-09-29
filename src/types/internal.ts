import type { GatsbyConfig, GatsbyNode, GatsbyBrowser, GatsbySSR } from 'gatsby';
import type { TransformOptions } from '@babel/core';
import type { RegisterOptions } from 'ts-node';
import type { ITSConfigFn, IPublicOpts, IGatsbyPluginDef } from './public';

export type PropertyBag = Record<string, any>;
}

export type IEndpointReturnTypes<T extends IGatsbyConfigTypes = IGatsbyConfigTypes> =
    T extends 'config'
        ? GatsbyConfig | ITSConfigFn<'config'>
        : T extends 'node'
            ? GatsbyNode | ITSConfigFn<'node'>
            : T extends 'browser'
                ? GatsbyBrowser
                : T extends 'ssr'
                    ? GatsbySSR
                    : unknown;

export type IEndpointReturnObject<T extends IGatsbyConfigTypes> =
    T extends 'config' ? GatsbyConfig
        : T extends 'node'
            ? GatsbyNode
            : T extends 'browser'
                ? GatsbyBrowser
                : T extends 'ssr'
                    ? GatsbySSR
                    : unknown;

export type InferredConfigType<T extends IEndpointReturnTypes> =
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

export type GatsbyEndpointResolverMapKeys = PickLiteral<IConfigTypes, 'plugin'>;
export type GatsbyEndpointResolverKeys = Exclude<IConfigTypes, GatsbyEndpointResolverMapKeys>;

export type IGatsbyEndpoints = {
    [K in GatsbyEndpointResolverKeys]?: string[];
}
export interface IGatsbyEndpointResolverMap {
    [K: string]: IGatsbyEndpoints;
}
export type IGatsbyResolveChain = IGatsbyEndpoints & {
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
    (args: IPublicOpts): TReturn[];
}

export type IRegisterOptions<T extends IRegisterType> =
    T extends 'ts-node'
        ? RegisterOptions
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
    props: PropertyBag;
}
