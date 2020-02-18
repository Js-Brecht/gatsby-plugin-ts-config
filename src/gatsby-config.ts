import * as path from 'path';
import { PluginOptions } from 'gatsby';
import { register, RegisterOptions } from 'ts-node';
import namespace from './namespace';

const gatsbyConfigs = ['config', 'node', 'browser', 'ssr'].join('|');

export interface ITsConfigArgs extends Omit<PluginOptions, 'plugins'> {
    configDir?: string;
    projectRoot?: string;
    tsNode?: RegisterOptions;
}

export default ({
    configDir = process.cwd(),
    projectRoot = process.cwd(),
    tsNode: tsNodeOpts = {},
}: ITsConfigArgs) => {
    // @ts-ignore
    global[namespace] = {
        configDir,
        projectRoot,
    };

    const isProjectConfig = (fPath: string) => {
        const checkPath = new RegExp(`^${path.join(configDir, `gatsby-(${gatsbyConfigs}).[jt]sx?`).replace(/([/\\.])/g, '\\$1')}$`);
        return checkPath.test(fPath);
    };

    if (tsNodeOpts.project) {
        tsNodeOpts.project = path.isAbsolute(tsNodeOpts.project) ? tsNodeOpts.project : path.resolve(path.relative(projectRoot, tsNodeOpts.project));
    }

    const tsNodeService = register({
        project: path.join(projectRoot, 'tsconfig.json'),
        compilerOptions: {
            module: "commonjs",
            target: "es2015",
            allowJs: true,
            noEmit: true,
            declaration: false,
            importHelpers: true,
            resolveJsonModule: true,
            jsx: "preserve",
        },
        files: true,
        ...tsNodeOpts,
    });
    tsNodeService.ignored = (fPath: string) => {
        if (isProjectConfig(fPath)) return false;
        /** This would match ALL typescript files.  We only want to match the user's gatsby config files */
        // return !(/\.tsx?$/.test(fPath));
        return true;
    };

    const ext = configDir === projectRoot ? '.ts' : '';

    try {
        const gatsbyConfig = require(path.join(configDir, `gatsby-config${ext}`))(projectRoot);
        return gatsbyConfig;
    } catch (err) {
        // No typescript config found, return nothing.
        return;
    }
};