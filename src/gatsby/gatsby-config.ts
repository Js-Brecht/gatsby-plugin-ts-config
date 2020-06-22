import * as path from 'path';
import { RegisterOptions } from 'ts-node';
import { TransformOptions } from '@babel/core';
import { getAbsoluteRelativeTo } from '../utils/fs-tools';
import {
    resolveGatsbyEndpoints,
    allGatsbyEndpoints,
    ignoreRootEndpoints,
    configEndpointSpecs,
    gatsbyConfigEndpoints,
    compilePlugins,
} from '../utils/endpoints';
import { tryRequireModule, getModuleObject } from '../utils/node';
import RequireRegistrar from '../utils/register';
import OptionsHandler from '../utils/options-handler';

import type { GatsbyConfig } from 'gatsby';
import type { ITSConfigArgs, IGatsbyConfigTypes, IEndpointResolutionSpec } from '../types';

export default (args = {} as ITSConfigArgs): GatsbyConfig => {
    const projectRoot = getAbsoluteRelativeTo(args.projectRoot || process.cwd());
    const configDir = getAbsoluteRelativeTo(projectRoot, args.configDir);
    const cacheDir = path.join(projectRoot, '.cache', 'caches', 'gatsby-plugin-ts-config');
    const pluginDir = path.resolve(path.join(__dirname, '..', '..'));

    const ignore: IGatsbyConfigTypes[] = [];
    const configEndpoint: IEndpointResolutionSpec = {
        type: 'config',
        ext: ['.js', '.ts'],
    };
    if (configDir === projectRoot) {
        ignore.push(...ignoreRootEndpoints.filter((nm) => !ignore.includes(nm)));
        configEndpoint.ext = ['.ts'];
    }

    const endpoints = resolveGatsbyEndpoints({
        endpointSpecs: [
            ...allGatsbyEndpoints.filter((nm) => !ignore.includes(nm) && nm !== 'config'),
            ...(!ignore.includes('config') && [configEndpoint] || []),
        ],
        endpointRoot: configDir,
    });

    const programOpts = {
        projectRoot,
        configDir,
        cacheDir,
        pluginDir,
    };

    OptionsHandler.set({
        ...programOpts,
        endpoints,
    });

    // if (args.JIT) {
    if (args.babel || !args.tsNode) {
        const babelOpts: TransformOptions = OptionsHandler.setBabelOpts(
            typeof args.babel === 'object'
                ? args.babel
                : undefined,
        );

        RequireRegistrar.init('babel', {
            registerOpts: babelOpts,
        });
    } else {
        const tsNodeOpts: RegisterOptions = OptionsHandler.setTsNodeOpts(
            typeof args.tsNode === 'boolean' ? {} : args.tsNode,
        );

        RequireRegistrar.init('ts-node', {
            registerOpts: tsNodeOpts,
        });
    }
    // }


    // Prefetch gatsby-node here so that we can collect the import chain.
    // Doing it here also means we can revert the changes to require.extensions
    // before continuing with the build.  The cached, transpiled source will be
    // retrieved later when it is required in gatsby-node
    const gatsbyNodeModule = tryRequireModule('node', endpoints);

    compilePlugins({
        plugins: OptionsHandler.plugins,
    });

    const gatsbyConfigModule = tryRequireModule('config', endpoints);
    const gatsbyConfig = getModuleObject(gatsbyConfigModule);

    OptionsHandler.includePlugins(gatsbyConfig?.plugins || []);
    OptionsHandler.doExtendPlugins(true);

    RequireRegistrar.revert();
    return {
        ...gatsbyConfig,
        plugins: [
            ...OptionsHandler.plugins.map((plugin) => ({
                resolve: plugin.path,
                options: plugin.options,
            })),
        ],
    };
};