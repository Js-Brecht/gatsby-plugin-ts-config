import * as path from 'path';
import * as fs from 'fs';
import { IResolveEndpointProps, IMakeGatsbyEndpointProps, IGatsbyEndpoints } from '../types';

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

export const resolveGatsbyEndpoints = ({
    apiEndpoints,
    configDir,
}: IResolveEndpointProps): IGatsbyEndpoints => {
    const resolved: IGatsbyEndpoints = {};

    for (const endpoint of apiEndpoints) {
        const endpointFile = `gatsby-${endpoint}`;
        const configFile = path.join(configDir, endpointFile);


    }

    return resolved;
}

/**
 * If defined `apiEndpoints` exist in the config storage directory,
 * then copy the `dist` versions to this plugin's root directory so
 * that they will be picked up by Gatsby.
 *
 * If the defined `apiEndpoints` don't exist in the config storage
 * and it exists in this plugin's root, then the copy in the plugin's
 * root will be deleted
 *
 * @param {IMakeGatsbyEndpointProps} setupEndpointProps
 * * `apiEndpoints`: The specific endpoint types to look for and process
 * * `resolvedEndpoints`: The collection of endpoints that have been resolved
 * in the user's configuration directory
 * * `distDir`: The location of files that can be copied to this plugin's root
 */
export const setupGatsbyEndpoints = ({
    apiEndpoints,
    resolvedEndpoints,
    distDir,
}: IMakeGatsbyEndpointProps) => {
    const pluginRoot = path.resolve(__dirname, '..', '..');
    for (const setupApi of apiEndpoints) {
        const endpointFile = `gatsby-${setupApi}.js`;
        const distFile = path.join(distDir, endpointFile);
        const pluginFile = path.join(pluginRoot, endpointFile);

        if (setupApi in resolvedEndpoints) {
            // Read from current directory extension
            const renderSrc = fs.readFileSync(distFile);
            // and copy to this plugin's root
            fs.writeFileSync(pluginFile, renderSrc);
        } else if (fileExists(pluginFile)) {
            fs.unlinkSync(pluginFile);
        }
    }
};