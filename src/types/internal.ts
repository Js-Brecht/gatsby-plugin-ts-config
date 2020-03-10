import { TransformOptions } from '@babel/core';
import { RegisterOptions } from 'ts-node';

export type IRegisterType = 'ts-node' | 'babel';
export type IValidExts = '.js' | '.ts' | '.jsx' | '.tsx';
export type IConfigTypes = 'config' | 'node' | 'browser' | 'ssr';
export type IEndpointResolutionSpec = IConfigTypes | {
    type: IConfigTypes;
    ext: IValidExts[];
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

export type IGatsbyEndpoints = {
    [k in IConfigTypes]?: string[];
}