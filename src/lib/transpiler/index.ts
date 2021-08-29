import path from "path";
import omit from "lodash/omit";

import {
    serializeObject,
} from "@util/objects";
import { preferDefault } from "@util/node";
import { Serializer } from "./serializer";
import { setTranspiler } from "./set-transpiler";

import type { Project } from "@lib/project";
import type {
    ApiType,
    TranspilerArgs,
    TranspileType,
    InitValue,
    PluginModule,
    TSConfigFn,
} from "@typeDefs";

export type Transpiler = ReturnType<typeof getTranspiler>;

export const getTranspiler = (
    project: Project,
    rootArgs: TranspilerArgs<TranspileType>,
) => {
    const rootKey = serializeObject(rootArgs);

    return function transpile<
        TApiType extends ApiType,
        T extends TranspileType = "babel"
    >(
        apiType: TApiType,
        init: InitValue,
        projectRoot: string,
        transpileRoot: string,
        overrideArgs?: TranspilerArgs<T>,
    ): PluginModule<TApiType> {
        const overrideKey = (
            overrideArgs && Serializer.serialize(overrideArgs)
        );

        const newTranspiler = !!(
            overrideKey &&
            overrideKey !== rootKey
        );

        const [transpilerKey, transpilerArgs] = newTranspiler
            ? [overrideKey!, overrideArgs!] as const
            : [rootKey, rootArgs] as const;

        const restore = setTranspiler(
            apiType,
            transpilerKey,
            transpilerArgs,
            transpileRoot,
            project,
        );

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
            if (restore) restore();
        }
    };
};