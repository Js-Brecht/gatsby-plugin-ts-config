import path from "path";
import { register as tsNodeRegister } from "ts-node";
import omit from "lodash/omit";
import babelRegister from "@babel/register";

import {
    serializeObject,
    objectsAreEqual,
} from "@util/objects";
import { Module, preferDefault } from "@util/node";

import type { Project } from "./project";
import type {
    ApiType,
    TranspileType,
    TranspilerOptions,
    InitValue,
    PluginModule,
    TSConfigFn,
    IgnoreFn,
    IgnoreHookFn,
} from "@typeDefs";

export type Transpiler = ReturnType<typeof getTranspiler>;
export type TranspilerArgs<
    T extends TranspileType = "babel"
> = {
    type: T;
    options: TranspilerOptions<T>
}

const extensions = [".ts", ".tsx", ".js", ".jsx"];
const origExtensions = {
    ...Module._extensions,
};
let baseExtensions: NodeJS.RequireExtensions;

export const getTranspiler = (
    project: Project,
    rootArgs: TranspilerArgs<TranspileType>,
) => {
    const rootKey = serializeObject(rootArgs);
    const options = project.options;
    const myExtensions = new Map<
        string,
        NodeJS.RequireExtensions
    >();
    const allowDirs: string[] = [];

    const addDir = (dir: string) => {
        allowDirs.push(dir);
    };
    const removeDir = (dir: string) => {
        const len = allowDirs.length - 1;
        allowDirs.forEach((_, i) => {
            const idx = len - i;
            const cur = allowDirs[idx];
            if (cur === dir) {
                allowDirs.splice(idx, 1);
            }
        });
    };
    const validDir = (dir: string) => (
        allowDirs.some((cur) => dir.startsWith(cur))
    );

    const getExtensions = (key: string) => {
        for (const [savedKey, extensions] of myExtensions.entries()) {
            if (key === savedKey) return extensions;
        }
        return;
    };

    return function transpile<
        TApiType extends ApiType,
        T extends TranspileType = "babel"
    >(
        apiType: TApiType,
        init: InitValue,
        pluginName: string,
        projectRoot: string,
        transpileRoot: string,
        overrideArgs?: TranspilerArgs<T>,
    ): PluginModule<TApiType> {
        const addChainedImport = project.importHandler(apiType, pluginName);
        addDir(transpileRoot);

        const ignoreRules: IgnoreFn[] = [
            // Module must not be a node_modules dependency
            (fname) => /node_modules/.test(fname),
        ];

        const getIgnore = (
            filename: string,
            rules: (IgnoreFn | IgnoreHookFn)[],
            orig: boolean,
        ) => (
            validDir(filename)
                ? false
                : rules.some((rule) => rule(filename, !!orig))
        );

        const ignore: IgnoreFn = (filename) => {
            if (filename.endsWith(".pnp.js")) return true;
            addChainedImport(filename);

            const origIgnore = getIgnore(filename, ignoreRules, false);
            const ignoreFile = options.hooks?.ignore
                ? getIgnore(filename, options.hooks.ignore, origIgnore)
                : origIgnore;

            return !!ignoreFile;
        };

        const only: IgnoreFn = (filename) => {
            return !ignore(filename);
        };

        const overrideKey = (
            overrideArgs && serializeObject(overrideArgs)
        );

        const newTranspiler = !!(
            overrideKey &&
            overrideKey !== rootKey
        );

        const [transpilerKey, transpilerArgs] = newTranspiler
            ? [overrideKey!, overrideArgs!] as const
            : [rootKey, rootArgs] as const;

        const {
            type: transpileType,
            options: transpilerOpts,
        } = transpilerArgs;

        const useExtensions = getExtensions(transpilerKey);
        let restoreExtensions: NodeJS.RequireExtensions | undefined;

        /**
         * We've registered an initial base set of extensions, which
         * means this function has run before.  This means we can always
         * restore back to those base extensions, or to the ones for
         * the transpiler that is wrapping this one.
         *
         * This makes it so we can restore the prior extensions
         * when we're done.  This should always resolve back
         * to the `baseExtensions` once all transpiler functions have
         * run
         */
        if (baseExtensions) {
            restoreExtensions = { ...Module._extensions };
            Module._extensions = { ...origExtensions };
        }

        if (useExtensions && baseExtensions) {
            Module._extensions = useExtensions;
        } else {
            switch (transpileType) {
                case "ts-node": {
                    const opts = transpilerOpts as TranspilerOptions<"ts-node">;
                    const tsNodeService = tsNodeRegister(opts);
                    tsNodeService.ignored = ignore;
                    break;
                }
                case "babel": {
                    const opts = transpilerOpts as TranspilerOptions<"babel">;
                    babelRegister({
                        ...opts,
                        extensions,
                        only: [only],
                    });
                    break;
                }
            }

            /**
             * This is the initial extensions setup; no transpiler ran before
             * this one (at least none that this program is aware of).
             *
             * Every transpilation chain after this one should (ultimately) resolve
             * extensions back to the `baseExtensions`
             */
            if (!baseExtensions) {
                baseExtensions = {
                    ...Module._extensions,
                };
                restoreExtensions = baseExtensions;
            }

            myExtensions.set(
                transpilerKey,
                { ...Module._extensions },
            );
        }

        try {
            if (typeof init === "function") {
                return omit(init(), ["__esModule"]) as PluginModule<TApiType>;
            } else {
                const requirePath = require.resolve(
                    path.resolve(
                        projectRoot,
                        init,
                    ),
                );
                const mod = require(requirePath);

                const resolveFn: TSConfigFn<any> = (opts, props) => {
                    let resolvedMod = preferDefault(mod);
                    const exports = require.cache[requirePath]?.exports;

                    if (!exports) {
                        throw new Error([
                            `Unable to retrieve require cache for module '${requirePath}'.`,
                            "This may indicate a serious issue",
                        ].join("\n"));
                    }

                    if (resolvedMod && typeof resolvedMod === "function") {
                        resolvedMod = resolvedMod(opts, props);
                    }

                    resolvedMod = omit(
                        Object.assign({}, exports, resolvedMod),
                        ["__esModule", "default"],
                    );
                    require.cache[requirePath]!.exports = resolvedMod;

                    return resolvedMod;
                };

                return resolveFn as PluginModule<TApiType>;
            }
        } finally {
            /**
             * `restoreExtensions` should never be undefined here,
             * but we restore back to the original extensions if all else fails
             */
            Module._extensions = restoreExtensions || origExtensions;
            removeDir(transpileRoot);
        }
    };
};