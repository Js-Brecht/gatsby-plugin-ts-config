import * as path from 'path';
import { PluginOptions } from 'gatsby';
import { register, RegisterOptions } from 'ts-node';
import namespace from '../utils/namespace';
import { getAbsoluteRelativeTo } from '../utils/tools';

export type IGatsbyConfigs = 'config' | 'node' | 'browser' | 'ssr';

const gatsbyConfigs: IGatsbyConfigs[] = ['config', 'node', 'browser', 'ssr'];
const ignoreInRoot: IGatsbyConfigs[] = ['browser', 'ssr'];

export interface ITsConfigArgs extends Omit<PluginOptions, 'plugins'> {
    configDir?: string;
    projectRoot?: string;
    ignore?: IGatsbyConfigs[];
    tsNode?: RegisterOptions;
}

export default ({
    configDir = process.cwd(),
    projectRoot = process.cwd(),
    ignore = [],
    tsNode: tsNodeOpts = {},
}: ITsConfigArgs) => {
    projectRoot = getAbsoluteRelativeTo(projectRoot);
    configDir = getAbsoluteRelativeTo(projectRoot, configDir);

    if (configDir === projectRoot) {
        ignore.push(...ignoreInRoot);
    }

    // @ts-ignore
    global[namespace] = {
        configDir,
        projectRoot,
        ignore,
    } as ITsConfigArgs;

    const gatsbyConfigMatch = gatsbyConfigs.filter((nm) => !ignore.includes(nm)).join('|');

    const isIgnored = new RegExp(`^${path.join(configDir, `gatsby-(${ignore}).[jt]sx?`).replace(/([/\\.])/g, '\\$1')}$`);
    const isProjectSrc = (fPath: string) => {
        if (isIgnored.test(fPath)) return false;
        return /\.tsx?$/.test(fPath);
    };

    if (tsNodeOpts.project) {
        tsNodeOpts.project = getAbsoluteRelativeTo(projectRoot, tsNodeOpts.project);
    }

    const compilerOptions = {
        module: "commonjs",
        target: "es2015",
        allowJs: true,
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
    tsNodeService.ignored = (fPath: string) => {
        if (isProjectSrc(fPath)) return false;
        /** This would match ALL typescript files.  We only want to match the user's gatsby src files */
        // return !(/\.tsx?$/.test(fPath));
        return true;
    };

    if (ignore.includes('config')) return;
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