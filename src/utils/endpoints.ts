import * as path from 'path';
import * as fs from 'fs';
import {
    IGatsbyEndpoints,
    IConfigTypes,
    IEndpointResolutionSpec,
} from '../types';
import { stringLiteral } from '@babel/types';
import { transformCodeToTemplate } from './babel';
import { checkFileWithExts, fileExists, allExt } from './fs-tools';

// *************************************

export interface IResolveEndpointProps {
    endpointSpecs: IEndpointResolutionSpec[];
    configDir: string;
}

/**
 * This will look in `configDir` for the specified Gatsby endpoints, and
 * return the resolved paths to each
 *
 * @param {IResolveEndpointProps} resolveProps What endpoints to resolve, and from where
 *
 * * `endpointSpecs`: What endpoints to resolve
 * * `configDir`: Where to resolve the endpoints
 * @returns {IGatsbyEndpoints} The resolved endpoints
 */
export const resolveGatsbyEndpoints = ({
    endpointSpecs,
    configDir,
}: IResolveEndpointProps): IGatsbyEndpoints => {
    const resolved: IGatsbyEndpoints = {};

    for (const endpoint of endpointSpecs) {
        const endpointType = typeof endpoint === 'string' ? endpoint : endpoint.type;
        const endpointExt = typeof endpoint === 'string' ? allExt : endpoint.ext;
        const endpointFile = `gatsby-${endpointType}`;
        const configFile = checkFileWithExts(path.join(configDir, endpointFile), endpointExt);
        if (configFile) {
            resolved[endpointType] = configFile;
        }
    }

    return resolved;
};

// ***************************************

export interface IMakeGatsbyEndpointProps {
    apiEndpoints: IConfigTypes[];
    resolvedEndpoints: IGatsbyEndpoints;
    distDir: string;
}

/**
 * If defined `apiEndpoints` exist in the config storage directory,
 * then copy this plugin's `dist` version to its root directory so
 * that they will be picked up by Gatsby.
 *
 * If the defined `apiEndpoints` don't exist in the config storage
 * directory, and it exists in this plugin's root, then the copy in
 * this plugin's root will be deleted
 *
 * @param {IMakeGatsbyEndpointProps} setupEndpointProps
 *
 * * `apiEndpoints`: The specific endpoint types to look for and process
 * * `resolvedEndpoints`: The collection of endpoints that have been resolved
 * in the user's configuration directory
 * * `distDir`: The location of files that can be copied to this plugin's root
 */
export const setupGatsbyEndpoints = ({
    apiEndpoints,
    resolvedEndpoints,
    distDir,
}: IMakeGatsbyEndpointProps): void => {
    const pluginRoot = path.resolve(__dirname, '..', '..');
    for (const setupApi of apiEndpoints) {
        const endpointFile = `gatsby-${setupApi}.js`;
        const distFile = path.join(distDir, endpointFile);
        const pluginFile = path.join(pluginRoot, endpointFile);

        // Only copy if this endpoint has been resolved already, so we know it exists
        if (setupApi in resolvedEndpoints) {
            const resolvedPath = resolvedEndpoints[setupApi] as string;
            transformCodeToTemplate({
                srcFile: distFile,
                targetFile: pluginFile,
                templateSpec: {
                    __TS_CONFIG_ENDPOINT_PATH: stringLiteral(resolvedPath),
                },
            });
        } else if (fileExists(pluginFile)) {
            // Endpoint doesn't exist, so remove it from this plugin's root
            console.log(`delete ${pluginFile}\n\n`);
            fs.unlinkSync(pluginFile);
        }
    }
};