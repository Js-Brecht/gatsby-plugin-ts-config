import * as path from 'path';
import { GatsbyConfig } from 'gatsby';
import { getAbsoluteRelativeTo } from '../utils/fs-tools';
import { setupGatsbyEndpoints, resolveGatsbyEndpoints } from '../utils/endpoints';
import { ITsConfigArgs, IConfigTypes, IEndpointResolutionSpec } from '../types';
import { preferDefault } from '../utils/node';
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

    const compilerOptions = {
        module: "commonjs",
        target: "es2015",
        allowJs: false,
        noEmit: true,
        declaration: false,
        importHelpers: true,
        resolveJsonModule: true,
        jsx: "preserve",
        ...tsNodeOpts.compilerOptions || {}
    }

    const tsNodeService = register({
        project: path.join(projectRoot, 'tsconfig.json'),
        compilerOptions,
        files: true,
        ...tsNodeOpts,
    });

    const isIgnored = new RegExp(`^${path.join(configDir, `gatsby-(${ignoreRootConfigs}).[jt]sx?`).replace(/([/\\.])/g, '\\$1')}$`);
    const isProjectSrc = (fPath: string) => {
        if (isIgnored.test(fPath)) return false;
        return /\.tsx?$/.test(fPath);
    };


    tsNodeService.ignored = (fPath: string) => {
        if (isProjectSrc(fPath)) return false;
        /** This would match ALL typescript files.  We only want to match the user's gatsby src files */
        // return !(/\.tsx?$/.test(fPath));
        return true;
    };

    setupGatsbyEndpoints({
        apiEndpoints: browserSsr.filter((api) => !ignore.includes(api)),
        configDir,
        distDir: __dirname,
    });

    let gatsbyConfig = {} as GatsbyConfig;
    if (endpoints.config) {
        try {
            const gatsbyConfigModule = require(endpoints.config);
            const gatsbyConfigEntry = preferDefault(gatsbyConfigModule);
            gatsbyConfig = typeof gatsbyConfigEntry === 'function' ? gatsbyConfigEntry(projectRoot) : gatsbyConfigEntry;
        } catch (err) {
            throw new Error(`[gatsby-plugin-ts-config] Unable to read your 'gatsby-config'!\n${err.stack}`);
        }
    }
    return gatsbyConfig;
};