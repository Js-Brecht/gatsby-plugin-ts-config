import * as path from 'path';
import { GatsbyConfig } from 'gatsby';
import { getAbsoluteRelativeTo } from '../utils/fs-tools';
import { resolveGatsbyEndpoints, browserSsr } from '../utils/endpoints';
import { ITsConfigArgs, IConfigTypes, IEndpointResolutionSpec } from '../types';
import { preferDefault } from '../utils/node';
import RequireRegistrar from '../utils/register';
import OptionsHandler from '../utils/options-handler';

const gatsbyEndpoints: IConfigTypes[] = [
    ...browserSsr,
    'config',
    'node',
];
const ignoreRootConfigs: IConfigTypes[] = [
    ...browserSsr,
];

export default ({
    configDir = process.cwd(),
    projectRoot = process.cwd(),
    tsNode: tsNodeOpts = {},
}: ITsConfigArgs = {}) => {
    projectRoot = getAbsoluteRelativeTo(projectRoot);
    configDir = getAbsoluteRelativeTo(projectRoot, configDir);

    const cacheDir = path.join(projectRoot, '.cache', 'caches', 'gatsby-plugin-ts-config');

    const ignore: IConfigTypes[] = [];
    const configEndpoint: IEndpointResolutionSpec = {
        type: 'config',
        ext: ['.js', '.ts'],
    };
    if (configDir === projectRoot) {
        ignore.push(...ignoreRootConfigs.filter((nm) => !ignore.includes(nm)));
        configEndpoint.ext = ['.ts'];
    }

    const endpoints = resolveGatsbyEndpoints({
        endpointSpecs: [
            ...gatsbyEndpoints.filter((nm) => !ignore.includes(nm) && nm !== 'config'),
            ...(!ignore.includes('config') && [configEndpoint] || []),
        ],
        configDir,
    });

    OptionsHandler.set({
        projectRoot,
        cacheDir,
        configDir,
        endpoints,
    });

    if (tsNodeOpts.project) {
        tsNodeOpts.project = getAbsoluteRelativeTo(projectRoot, tsNodeOpts.project);
    }

    RequireRegistrar.init('ts-node', {
        registerOpts: tsNodeOpts,
        programOpts: {
            projectRoot,
            configDir,
            cacheDir,
        },
    });

    let gatsbyConfig = {} as GatsbyConfig;
    if (endpoints.config) {
        try {
            RequireRegistrar.start();
            const gatsbyConfigModule = preferDefault(require(endpoints.config));
            gatsbyConfig = typeof gatsbyConfigModule === 'function' ? gatsbyConfigModule(OptionsHandler.get()) : gatsbyConfigModule;
        } catch (err) {
            throw new Error(`[gatsby-plugin-ts-config] Unable to read your 'gatsby-config'!\n${err.stack}`);
        } finally {
            RequireRegistrar.stop();
        }
    }
    return gatsbyConfig;
};