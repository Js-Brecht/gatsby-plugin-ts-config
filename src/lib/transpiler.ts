import path from "path";
import { register as tsNodeRegister } from "ts-node";
import babelRegister from "@babel/register";

import { Module } from "@util/node";
import { getImportHandler } from "./imports";

import type {
    ApiType,
    TranspilerOptions,
    TranspileType,
    InitValue,
    PluginModule,
} from "@typeDefs/internal";

type IgnoreFn = (filename: string) => boolean;

export type Transpiler = ReturnType<typeof getTranspiler>;

export interface ITranspilerProps<T extends TranspileType> {
    transpilerOpts: TranspilerOptions<T>;
    flattenDefault?: boolean;
}

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
        T extends ApiType
    >(
        apiType: T,
        init: InitValue,
        pluginName: string,
        projectRoot: string,
    ): PluginModule<T> {
        const addChainedImport = getImportHandler(apiType, pluginName);

        const ignore: IgnoreFn = (filename) => {
            if (filename.endsWith(".pnp.js")) return true;
            addChainedImport(filename);

            if (filename.indexOf("node_modules") > -1) return true;
            return false;
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
                return init() as PluginModule<T>;
            } else {
                const requirePath = path.resolve(
                    projectRoot,
                    init,
                );
                const mod = require(requirePath);
                if (mod.default && typeof mod.default === "object" && flattenDefault) {
                    const exports = require.cache[requirePath]?.exports;
                    if (exports) {
                        Object.assign(exports, mod.default);
                        delete exports.default;
                    }
                }
                return mod;
            }
        } finally {
            Module._extensions = origExtensions;
        }
    };
};