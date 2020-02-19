import * as path from 'path';
import * as fs from 'fs';
import { IGatsbyConfigs } from '../gatsby/gatsby-config';

export const getAbsoluteRelativeTo = (from: string, to?: string): string => {
    if (to && path.isAbsolute(to)) return to;
    const absolute = path.join(
        path.isAbsolute(from) ? from : path.resolve(from),
        to || ''
    );
    return absolute;
}

export const fileExists = (fPath: string): boolean => {
    try {
        const fStats = fs.statSync(fPath);
        if (fStats) return true;
    } catch (err) {
        // noop
    }
    return false;
}

export const checkFileWithExt = (fPath: string, extensions: string[]): boolean => {
    for (const ext of extensions) {
        if (fileExists(fPath + ext)) return true;
    }
    return false;
}

interface IMakeGatsbyEndpointArgs {
    apiEndpoints: IGatsbyConfigs[];
    configDir: string;
    distDir: string;
}

export const setupGatsbyEndpoints = ({
    apiEndpoints,
    configDir,
    distDir,
}: IMakeGatsbyEndpointArgs) => {
    const pluginRoot = path.dirname(require.resolve('gatsby-plugin-ts-config'));
    for (const renderApi of apiEndpoints) {
        const gatsbyExtension = `gatsby-${renderApi}`;
        const configDirExtension = path.join(configDir, gatsbyExtension);
        const distExtension = path.join(distDir, `${gatsbyExtension}.js`);
        const curExtension = path.join(pluginRoot, `${gatsbyExtension}.js`);
        if (
            // browser or ssr extensions exist in configDir
            checkFileWithExt(configDirExtension, ['.ts', '.js'])
        ) {
            // Read from current directory extension
            const renderSrc = fs.readFileSync(distExtension);
            // and copy to this plugin's root
            fs.writeFileSync(curExtension, renderSrc);
        } else { // browser, or ssr, extension is being ignored
            // delete it from this plugin's root, so it isn't read by Gatsby
            if (fileExists(curExtension)) {
                fs.unlinkSync(curExtension);
            }
        }
    }
}