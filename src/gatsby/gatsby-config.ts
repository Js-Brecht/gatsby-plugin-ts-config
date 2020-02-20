import * as path from 'path';
import { createConfigItem, TransformOptions } from '@babel/core';
import { ITsConfigArgs, IConfigTypes, IGlobalOpts, IEndpointResolutionSpec, IGatsbyEndpoints } from '../types';
import OptionsHandler from '../utils/options-handler';
import { getAbsoluteRelativeTo } from '../utils/fs-tools';
import { setupGatsbyEndpoints, resolveGatsbyEndpoints, transformGatsbyEndpoints } from '../utils/endpoints';
import { preferDefault } from '../utils/node';
import { createPresets } from '../utils/babel';

const gatsbyEndpoints: IConfigTypes[] = ['browser', 'ssr', 'config', 'node'];
const browserSsr: IConfigTypes[] = ['browser', 'ssr'];
const ignoreRootConfigs: IConfigTypes[] = [
    ...browserSsr,
];

export default ({
    configDir = process.cwd(),
    projectRoot = process.cwd(),
}: ITsConfigArgs = {}) => {
    projectRoot = getAbsoluteRelativeTo(projectRoot);
    configDir = getAbsoluteRelativeTo(projectRoot, configDir);

    const pluginRoot = path.resolve(__dirname, '..', '..');
    const cacheDir = path.join(pluginRoot, '.cache');

    const presets = createPresets(
        [
            {
                name: '@babel/preset-typescript',
            },
            {
                name: '@babel/preset-env',
                options: {
                    modules: [
                        'commonjs',
                    ],
                },
            },
        ],
        {
            dirname: projectRoot,
        },
    );
    const opts: TransformOptions = {
        cwd: projectRoot,
        babelrc: false,
        presets,
    };

    const ignore: IConfigTypes[] = [];
    const configEndpoint: IEndpointResolutionSpec = {
        type: 'config',
        ext: ['.js', '.ts'],
    };
    if (configDir === projectRoot) {
        ignore.push(...ignoreRootConfigs.filter((nm) => !ignore.includes(nm)));
        configEndpoint.ext = ['.js'];
    }

    const endpoints = resolveGatsbyEndpoints({
        endpointSpecs: [
            ...gatsbyEndpoints.filter((nm) => !ignore.includes(nm) && nm !== 'config'),
            ...(!ignore.includes('config') && [configEndpoint] || []),
        ],
        configDir,
    });

    Object.assign(endpoints, transformGatsbyEndpoints({
        endpoints: Object.entries(endpoints).reduce<IGatsbyEndpoints>((acc, [key, path]) => {
            const thisEndpoint = key as IConfigTypes;
            if (!browserSsr.includes(thisEndpoint) && path) {
                acc[thisEndpoint] = path;
            }
            return acc;
        }, {}),
        projectRoot,
        configDir,
        cacheDir,
        opts,
    }));

    setupGatsbyEndpoints({
        apiEndpoints: browserSsr.filter((api) => !ignore.includes(api)),
        resolvedEndpoints: endpoints,
        distDir: __dirname,
    });

    OptionsHandler.set({
        projectRoot,
        cacheDir,
        configDir,
        endpoints,
        ignore,
        opts,
    });

    if (endpoints.config) {
        try {
            const userGatsbyConfig = preferDefault(require(endpoints.config));
            const gatsbyConfig = typeof userGatsbyConfig === 'function' ? userGatsbyConfig(projectRoot) : userGatsbyConfig;
            return gatsbyConfig;
        } catch (err) {
            // No typescript config found, return nothing.
        }
    }
    return;
};