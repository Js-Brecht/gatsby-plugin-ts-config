import path from "path";
import { register as tsNodeRegister } from "ts-node";
import babelRegister from "@babel/register";

import { Module, preferDefault } from "@util/node";
import { getImportHandler } from "./options/imports";

import type {
    ApiType,
    TranspilerOptions,
    TranspileType,
    InitValue,
    PluginModule,
} from "@typeDefs/internal";
import type {
    TSConfigFn,
} from "@typeDefs/public";

type IgnoreFn = (filename: string) => boolean;

export type Transpiler = ReturnType<typeof getTranspiler>;

export interface ITranspilerProps<T extends TranspileType> {
    transpilerOpts: TranspilerOptions<T>;
    flattenDefault?: boolean;
}

const getIgnoreRules = (projectRoot: string): IgnoreFn[] => [
    (fname) => !fname.startsWith(projectRoot),
    (fname) => fname.startsWith(
        path.join(projectRoot, "node_modules"),
    ),
];

export const getTranspiler = <T extends TranspileType>(
    type: T,
    {
        transpilerOpts,
        flattenDefault,
    }: ITranspilerProps<T>,
) => {
    const extensions = [".ts", ".tsx", ".js", ".jsx"];
    const origExtensions = {
        ...Module._extensions,
        ".ts": Module._extensions[".js"],
        ".tsx": Module._extensions[".jsx"],
    };
    let newExtensions: NodeJS.RequireExtensions;

    return function transpile<
        TApiType extends ApiType
    >(
        apiType: TApiType,
        init: InitValue,
        pluginName: string,
        projectRoot: string,
    ): PluginModule<TApiType> {
        const addChainedImport = getImportHandler(apiType, pluginName);

        const ignoreRules: IgnoreFn[] = [
            // Module must be a part of the current project
            (fname) => !fname.startsWith(projectRoot),
            // Module must not be a node_modules dependency of
            // the current project
            (fname) => fname.startsWith(
                path.join(projectRoot, "node_modules"),
            ),
        ];

        const ignore: IgnoreFn = (filename) => {
            if (filename.endsWith(".pnp.js")) return true;
            addChainedImport(filename);
            return ignoreRules.some((rule) => rule(filename));
        };

        const only: IgnoreFn = (filename) => {
            return !ignore(filename);
        };

        if (newExtensions) {
            Module._extensions = newExtensions;
        } else {
            switch (type) {
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
            newExtensions = {
                ...Module._extensions,
            };
        }

        try {
            if (typeof init === "function") {
                return init() as PluginModule<TApiType>;
            } else {
                const requirePath = path.resolve(
                    projectRoot,
                    init,
                );
                const mod = require(requirePath);

                const resolveFn: TSConfigFn<any> = (opts, props) => {
                    console.log("Resolving:", requirePath, require.cache[requirePath]?.exports);

                    let resolvedMod = preferDefault(mod);
                    const exports = require.cache[requirePath]?.exports;

                    if (resolvedMod && typeof resolvedMod === "function") {
                        resolvedMod = resolvedMod(opts, props);
                    }

                    if (exports && resolvedMod && typeof resolvedMod === "object") {
                        Object.assign(exports, resolvedMod);
                    }

                    if (exports.default) delete exports.default;

                    console.log("Resolved:", requirePath, require.cache[requirePath]?.exports);

                    return mod;
                };

                return resolveFn as PluginModule<TApiType>;
            }
        } finally {
            Module._extensions = origExtensions;
        }
    };
};