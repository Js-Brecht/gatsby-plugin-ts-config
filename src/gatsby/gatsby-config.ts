import * as path from 'path';
import { GatsbyConfig } from 'gatsby';
import { RegisterOptions } from 'ts-node';
import { TransformOptions } from '@babel/core';
import { getAbsoluteRelativeTo } from '../utils/fs-tools';
import { resolveGatsbyEndpoints, browserSsr } from '../utils/endpoints';
import { ITSConfigArgs, IConfigTypes, IEndpointResolutionSpec } from '../types';
import { preferDefault } from '../utils/node';
import RequireRegistrar from '../utils/register';
import OptionsHandler from '../utils/options-handler';
import { throwError } from '../utils/errors';

const gatsbyEndpoints: IConfigTypes[] = [
    ...browserSsr,
    'config',
    'node',
];
const ignoreRootConfigs: IConfigTypes[] = [
    ...browserSsr,
];

export default (args = {} as ITSConfigArgs) => {
    const projectRoot = getAbsoluteRelativeTo(args.projectRoot || process.cwd());
    const configDir = getAbsoluteRelativeTo(projectRoot, args.configDir);
    const cacheDir = path.join(projectRoot, '.cache', 'caches', 'gatsby-plugin-ts-config');
    const pluginDir = path.resolve(path.join(__dirname, '..', '..'));

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

    if (args.JIT) {
        if (args.tsNode) {
            const tsNodeOpts: RegisterOptions = typeof args.tsNode === 'boolean' ? {} : args.tsNode;

            if (tsNodeOpts.project) {
                tsNodeOpts.project = getAbsoluteRelativeTo(projectRoot, tsNodeOpts.project);
            }

            RequireRegistrar.init('ts-node', {
                registerOpts: tsNodeOpts,
                programOpts,
            });
        } else {
            const babelOpts: TransformOptions = OptionsHandler.setBabelOpts(
                typeof args.babel === 'object'
                    ? args.babel
                    : undefined,
            );

            RequireRegistrar.init('babel', {
                registerOpts: babelOpts,
                programOpts,
            });
        }
    }


    let gatsbyConfig = {} as GatsbyConfig;
    if (endpoints.config) {
        try {
            RequireRegistrar.start();
            const gatsbyConfigModule = preferDefault(require(endpoints.config));
            gatsbyConfig = typeof gatsbyConfigModule === 'function' ? gatsbyConfigModule(OptionsHandler.public()) : gatsbyConfigModule;
        } catch (err) {
            throwError(`[gatsby-plugin-ts-config] An error occurred while reading your gatsby-config!`, err);
        } finally {
            RequireRegistrar.stop();
        }
    }
    return gatsbyConfig;
};