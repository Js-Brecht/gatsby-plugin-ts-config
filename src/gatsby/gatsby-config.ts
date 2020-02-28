import * as path from 'path';
import { GatsbyConfig } from 'gatsby';
import { getAbsoluteRelativeTo } from '../utils/fs-tools';
import { setupGatsbyEndpoints, resolveGatsbyEndpoints } from '../utils/endpoints';
import { ITsConfigArgs, IConfigTypes, IEndpointResolutionSpec } from '../types';
import { preferDefault } from '../utils/node';
import RequireRegistrar from '../utils/register';
import OptionsHandler from '../utils/options-handler';

const gatsbyEndpoints: IConfigTypes[] = ['browser', 'ssr', 'config', 'node'];
const browserSsr: IConfigTypes[] = ['browser', 'ssr'];
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

    const pluginRoot = path.resolve(__dirname, '..', '..');
    const cacheDir = path.join(pluginRoot, '.cache');

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

    setupGatsbyEndpoints({
        apiEndpoints: browserSsr,
        resolvedEndpoints: endpoints,
        distDir: __dirname,
    });

    OptionsHandler.set({
        projectRoot,
        cacheDir,
        configDir,
        endpoints,
        ignore,
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
            const gatsbyConfigModule = require(endpoints.config);
            const gatsbyConfigEntry = preferDefault(gatsbyConfigModule);
            gatsbyConfig = typeof gatsbyConfigEntry === 'function' ? gatsbyConfigEntry(projectRoot) : gatsbyConfigEntry;
        } catch (err) {
            throw new Error(`[gatsby-plugin-ts-config] Unable to read your 'gatsby-config'!\n${err.stack}`);
        } finally {
            RequireRegistrar.stop();
        }
    }
    return gatsbyConfig;
};