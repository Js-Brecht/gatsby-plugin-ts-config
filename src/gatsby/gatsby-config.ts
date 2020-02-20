import * as path from 'path';
import { createConfigItem, TransformOptions, loadPartialConfig } from '@babel/core';

import { ITsConfigArgs, IGatsbyConfigTypes, IGlobalOpts } from '../types';
import namespace from '../utils/namespace';
import { getAbsoluteRelativeTo, setupGatsbyEndpoints, resolveGatsbyEndpoints } from '../utils/tools';

const gatsbyEndpoints: IGatsbyConfigTypes[] = ['browser', 'ssr', 'config', 'node'];
const browserSsr: IGatsbyConfigTypes[] = ['browser', 'ssr'];
const ignoreRootConfigs: IGatsbyConfigTypes[] = [
    ...browserSsr,
];

export default ({
    configDir = process.cwd(),
    projectRoot = process.cwd(),
}: ITsConfigArgs = {}) => {
    projectRoot = getAbsoluteRelativeTo(projectRoot);
    configDir = getAbsoluteRelativeTo(projectRoot, configDir);

    const typescriptPreset = createConfigItem([require.resolve('@babel/preset-typescript')],{
        dirname: projectRoot,
        type: "preset",
    })
    const opts: TransformOptions = {
        cwd: projectRoot,
        babelrc: true,
        presets: [
            typescriptPreset,
        ]
    }

    const ignore: IGatsbyConfigTypes[] = [];
    if (configDir === projectRoot) ignore.push(...ignoreRootConfigs.filter((nm) => !ignore.includes(nm)));

    const endpoints = resolveGatsbyEndpoints({
        apiEndpoints: gatsbyEndpoints.filter((nm) => !ignore.includes(nm)),
        configDir,
    })

    const globalOpts: IGlobalOpts = {
        endpoints,
        ignore,
        opts,
    };

    // @ts-ignore
    global[namespace] = globalOpts;


    setupGatsbyEndpoints({
        apiEndpoints: browserSsr.filter((api) => !ignore.includes(api)),
        configDir,
        distDir: __dirname,
    });

    const ext = configDir === projectRoot ? '.ts' : '';

    try {
        const userGatsbyConfig = require(path.join(configDir, `gatsby-config${ext}`));
        const gatsbyConfig = typeof userGatsbyConfig === 'function' ? userGatsbyConfig(projectRoot) : userGatsbyConfig;
        return gatsbyConfig;
    } catch (err) {
        // No typescript config found, return nothing.
        return;
    }
};