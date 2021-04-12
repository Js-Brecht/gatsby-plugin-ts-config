import * as path from "path";
import * as fs from "fs-extra";
import { checkFileWithExts, allExt, fileExists, isDir } from "./fs-tools";
import { createRequire, tryRequireModule } from "./node";

import type {
    GatsbyEndpoints,
    GatsbyConfigTypes,
    EndpointResolutionSpec,
    IPluginDetails,
} from "../types";

export const gatsbyEndpointProxies: GatsbyConfigTypes[] = ["browser", "ssr"];
export const gatsbyConfigEndpoints: GatsbyConfigTypes[] = ["config", "node"];
export const allGatsbyEndpoints: GatsbyConfigTypes[] = [
    ...gatsbyConfigEndpoints,
    ...gatsbyEndpointProxies,
];
export const ignoreRootEndpoints: GatsbyConfigTypes[] = [
    ...gatsbyEndpointProxies,
];


export const configEndpointSpecs: EndpointResolutionSpec[] = [
    {
        type: "config",
        ext: [".js", ".ts"],
    },
    {
        type: "node",
        ext: [".js", ".ts"],
    },
];

// *************************************

export interface IResolveEndpointProps {
    endpointSpecs: EndpointResolutionSpec[];
    endpointRoot: string;
}

/**
 * This will look in `configDir` for the specified Gatsby endpoints, and
 * return the resolved paths to each
 *
 * @param {IResolveEndpointProps} resolveProps What endpoints to resolve, and from where
 *
 * * `endpointSpecs`: What endpoints to resolve
 * * `configDir`: Where to resolve the endpoints
 * @returns {GatsbyEndpoints} The resolved endpoints
 */
export const resolveGatsbyEndpoints = ({
    endpointSpecs,
    endpointRoot,
}: IResolveEndpointProps): GatsbyEndpoints => {
    const resolved: GatsbyEndpoints = {};

    for (const endpoint of endpointSpecs) {
        const endpointType = typeof endpoint === "string" ? endpoint : endpoint.type;
        const endpointExt = typeof endpoint === "string" ? allExt : endpoint.ext;
        const endpointFile = `gatsby-${endpointType}`;
        const configFile = checkFileWithExts(path.join(endpointRoot, endpointFile), endpointExt);
        if (configFile) {
            resolved[endpointType] = [configFile];
        }
    }

    return resolved;
};

// ***************************************

export interface IMakeGatsbyEndpointProps {
    resolvedEndpoints: GatsbyEndpoints;
    distDir: string;
    cacheDir: string;
}


/**
 * If defined `apiEndpoints` exist in the user's config directory,
 * then copy this plugin's `dist` version to the user's cache directory
 * so that they can proxy the request from this plugin to the user's
 * endpoints.
 *
 * @param {IMakeGatsbyEndpointProps} setupEndpointProps
 *
 * * `resolvedEndpoints`: The collection of endpoints that have been resolved
 * in the user's configuration directory
 * * `distDir`: The location of files that can be copied to this user's cache
 * * `cacheDir`: The location to write the proxy module
 */
export const setupGatsbyEndpointProxies = ({
    resolvedEndpoints,
    cacheDir,
}: IMakeGatsbyEndpointProps): void => {
    for (const setupApi of gatsbyEndpointProxies) {
        const endpointFile = `gatsby-${setupApi}.js`;
        const targetFile = path.join(cacheDir, endpointFile);

        let moduleSrc;
        if (setupApi in resolvedEndpoints) {
            // If User endpoint was resolved, then write out the proxy
            // module that will point to the user's
            const resolvedPath = resolvedEndpoints[setupApi]![0] as string;
            moduleSrc = `module.exports = require("${
                resolvedPath.replace(/\\/g, "\\\\")
            }");`;
        } else {
            // User endpoint was not resolved, so just write an empty module
            moduleSrc = `module.exports = {};`;
        }
        fs.ensureDirSync(path.dirname(targetFile));
        fs.writeFileSync(targetFile, moduleSrc);
    }
};

// ***********************************************

interface IResolvePluginPathProps {
    projectRoot: string;
    pluginName: string;
}

export const resolvePluginPath = ({
    projectRoot,
    pluginName,
}: IResolvePluginPathProps): string => {
    const scopedRequire = createRequire(`${projectRoot}/<internal>`);
    try {
        const pluginPath = path.dirname(
            scopedRequire.resolve(`${pluginName}/package.json`),
        );
        return pluginPath;
    } catch (err) {
        const localPluginsDir = path.resolve(projectRoot, "plugins");
        const pluginDir = path.join(localPluginsDir, pluginName);
        if (isDir(path.join(localPluginsDir, pluginName))) {
            const pkgJson = fileExists(path.join(pluginDir, "package.json"));
            if (pkgJson && pkgJson.isFile()) {
                return pluginDir;
            }
        }
        return "";
    }
};

interface ICompilePluginsProps {
    plugins: IPluginDetails[];
}

export const compilePlugins = ({
    plugins,
}: ICompilePluginsProps) => {
    for (const pluginDetails of plugins) {
        const pluginEndpoints = resolveGatsbyEndpoints({
            endpointSpecs: configEndpointSpecs,
            endpointRoot: pluginDetails.path,
        });
        for (const type of gatsbyConfigEndpoints) {
            const pluginEndpointModule = tryRequireModule(type, pluginEndpoints, true, pluginDetails.name);
        }
    }
};