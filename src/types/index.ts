import { PluginOptions, GatsbyConfig } from 'gatsby';
import { TransformOptions } from '@babel/core';

export interface ITsConfigArgs extends Omit<PluginOptions, 'plugins'> {
    configDir?: string;
    projectRoot?: string;
}

export type IGatsbyConfigTypes = 'config' | 'node' | 'browser' | 'ssr';

export interface IGlobalOpts {
    endpoints: IGatsbyEndpoints;
    ignore: IGatsbyConfigTypes[];
    opts: TransformOptions;
}

export type IGatsbyEndpoints = {
    [k in IGatsbyConfigTypes]?: string;
}

export interface IMakeGatsbyEndpointProps {
    apiEndpoints: IGatsbyConfigTypes[];
    resolvedEndpoints: IGatsbyEndpoints;
    distDir: string;
}

export interface IResolveEndpointProps {
    apiEndpoints: IGatsbyConfigTypes[];
    configDir: string;
}

export type IGeneratedGatsbyConfig = Pick<GatsbyConfig, 'plugins'>;
export interface IGenerateConfig {
    (args: ITsConfigArgs): IGeneratedGatsbyConfig;
}