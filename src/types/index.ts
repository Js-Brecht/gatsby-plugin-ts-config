import { PluginOptions } from 'gatsby';
import { TransformOptions } from '@babel/core';

export interface ITsConfigArgs extends Omit<PluginOptions, 'plugins'> {
    configDir?: string;
    projectRoot?: string;
}

export type IValidExts = '.js' | '.ts' | '.jsx' | '.tsx';
export type IConfigTypes = 'config' | 'node' | 'browser' | 'ssr';
export type IEndpointResolutionSpec = IConfigTypes | {
    type: IConfigTypes;
    ext: IValidExts[];
}

export interface IGlobalOpts {
    projectRoot: string;
    configDir: string;
    cacheDir: string;
    endpoints: IGatsbyEndpoints;
    ignore: IConfigTypes[];
    opts: TransformOptions;
}

export type IGatsbyEndpoints = {
    [k in IConfigTypes]?: string;
}
