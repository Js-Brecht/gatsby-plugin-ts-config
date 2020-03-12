import { GatsbyConfig, GatsbyNode, GatsbyBrowser, GatsbySSR } from 'gatsby';
import { TransformOptions } from '@babel/core';
import { RegisterOptions } from 'ts-node';
import { ITSConfigFn } from './public';

export type IRegisterType = 'ts-node' | 'babel';
export type IValidExts = '.js' | '.ts' | '.jsx' | '.tsx';
export type IConfigTypes = 'config' | 'node' | 'browser' | 'ssr';
export type IEndpointResolutionSpec = IConfigTypes | {
    type: IConfigTypes;
    ext: IValidExts[];
}

export type IEndpointReturnTypes<T extends IConfigTypes = IConfigTypes> = T extends 'config'
    ? GatsbyConfig | ITSConfigFn<'config'>
    : T extends 'node'
        ? GatsbyNode | ITSConfigFn<'node'>
        : T extends 'browser'
            ? GatsbyBrowser
            : T extends 'ssr'
                ? GatsbySSR
                : unknown;

export type IEndpointReturnObject<T extends IConfigTypes> = T extends 'config'
    ? GatsbyConfig
    : T extends 'node'
        ? GatsbyNode
        : T extends 'browser'
            ? GatsbyBrowser
            : T extends 'ssr'
                ? GatsbySSR
                : unknown;

export type InferredConfigType<T extends IEndpointReturnTypes, K = IConfigTypes> = T extends GatsbyConfig | ITSConfigFn<'config'>
    ? 'config'
    : T extends GatsbyNode | ITSConfigFn<'node'>
        ? 'node'
        : T extends GatsbyBrowser
            ? 'browser'
            : 'ssr';

export type IGatsbyEndpoints = {
    [k in IConfigTypes]?: string[];
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
    endpoints: IGatsbyEndpoints;
    babelOpts?: TransformOptions;
    tsNodeOpts?: RegisterOptions;
}

