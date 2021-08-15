import path from "path";
import { PluginError } from "@util/output";
import {
    getCallSite,
    getProjectPkgJson,
} from "@util/project";
import { getRegisterOptions } from "@lib/options";
import { getTranspiler } from "@lib/transpiler";
import { processApiModule } from "@lib/api-module";

import type {
    InitValue,
    ApiType,
    TsConfigPluginOptions,
    NoFirstParameter,
} from "@typeDefs/internal";

export * from "./types/public";

type UsePluginModule = NoFirstParameter<typeof useGatsbyPluginModule>;

const useGatsbyPluginModule = (
    apiType: ApiType,
    init: InitValue,
    options = {} as TsConfigPluginOptions,
) => {
    const callSite = getCallSite();
    const callFile = callSite?.getFileName();
    if (!callFile) {
        throw new PluginError("Unable to determine call site");
    }

    const callDir = path.dirname(callFile);
    const [projectRoot, pkgJson] = getProjectPkgJson(callDir) || [];
    if (!pkgJson || !projectRoot) {
        throw new PluginError("Unable to locate project root");
    }

    const projectName = pkgJson.name;
    if (!projectName) {
        throw new PluginError("Unable to determine caller's project name");
    }

    const transpileType = options.type || "babel";

    const transpilerOpts = getRegisterOptions(
        projectRoot,
        transpileType,
        options.transpilerOptions,
    );

    const transpiler = getTranspiler(transpileType, {
        transpilerOpts,
        flattenDefault: true,
    });

    try {
        return processApiModule({
            apiType,
            init,
            transpiler,

            projectRoot,
            projectName,
            propBag: options.props,
        });
    } catch (err) {
        throw new PluginError(err);
    }
};


/**
 * Imports/processes a `gatsby-config` module, and returns results to Gatsby
 *
 * @remarks
 *
 * - When used alone, this will support a `gatsby-config.ts` in your
 *   project's root directory.
 *
 * - The `propBag` will the shared between `useGatsbyConfig` and `useGatsbyNode`,
 *   and can be mutated by either.  After processing `gatsby-config` & `gatsby-node`
 *   your project's local plugins will be transpiled as well, and a copy of this
 *   `propBag` will be passed to each.
 *
 * @param {InitValue} initValue -
 * - Can be a string, pointing to a `gatsby-config.ts` file.  Can be relative
 *   or absolute.  When relative, it is relative to your project's `package.json`
 *
 * - Can be a callback function, which can either `require()` another module
 *   (causing it to be transpiled; default exports supported), or directly return
 *   the object needed to return to Gatsby.
 *
 * @param {TsConfigPluginOptions} options - The collection of options to use
 * throughout this instance.  These options will be shared with `useGatsbyNode` for
 * the current project or local plugin.
 */
export const useGatsbyConfig: UsePluginModule = (...args) => (
    useGatsbyPluginModule("config", ...args)
);

/**
 * Imports/processes a `gatsby-node` module, and returns results to Gatsby
 *
 * @remarks
 *
 * - When used without `useGatsbyConfig`, your project's local plugins
 *   will not be transpiled.
 *
 * @param {InitValue} initValue -
 * - Can be a string, pointing to a `gatsby-node.ts` file.  Can be relative
 *   or absolute.  When relative, it is relative to your project's `package.json`
 *
 * - Can be a callback function, which can either `require()` another module
 *   (causing it to be transpiled; default exports supported), or directly return
 *   the object needed to return to Gatsby.
 *
 * @param {TsConfigPluginOptions} options - The collection of options to use
 * throughout this instance.  The same options defined in `useGatsbyConfig` will
 * be passed to `useGatsbyNode`, and additional options defined here will extend them.
 */
export const useGatsbyNode: UsePluginModule = (...args) => (
    useGatsbyPluginModule("node", ...args)
);