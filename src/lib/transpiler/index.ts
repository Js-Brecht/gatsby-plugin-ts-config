import path from "path";
import omit from "lodash/omit";

import { preferDefault } from "@util/node";
import { resolveFilePath } from "@util/fs-tools";
import { Serializer } from "../serializer";
import { setTranspiler } from "./set-transpiler";

import type { Project } from "@lib/project";
import type {
    TranspilerArgs,
    TranspileType,
    InitValue,
    TranspilerReturn,
    TSConfigFn,
} from "@typeDefs";


export type Transpiler<TProject extends Project<any> = Project> = <
    T extends TranspileType = "babel"
>(
    init: InitValue,
    unwrapApi: boolean,
    overrideArgs?: TranspilerArgs<T>,
) => TranspilerReturn<TProject>;

export const getTranspiler = <TProject extends Project<any>>(
    project: TProject,
    rootArgs: TranspilerArgs<TranspileType>,
): Transpiler<TProject> => {
    const rootKey = Serializer.serialize(rootArgs)!;

    return function transpile(init, unwrapApi, overrideArgs) {
        const projectRoot = project.projectRoot;

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
            transpilerKey,
            transpilerArgs,
            project,
        );

        try {
            if (typeof init === "function") {
                return omit(init(), ["__esModule"]) as TranspilerReturn<TProject>;
            } else {
                const requirePath = resolveFilePath(
                    projectRoot,
                    path.resolve(projectRoot, init),
                );

                if (!requirePath) {
                    throw new Error([
                        `Unable to resolve module '${init}' from`,
                        `Path: ${projectRoot}`,
                    ].join("\n"));
                }

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

                    if (!unwrapApi) {
                        return (
                            require.cache[requirePath]!.exports = omit(mod, ["__esModule"])
                        );
                    }

                    if (resolvedMod && typeof resolvedMod === "function") {
                        resolvedMod = resolvedMod(opts, props);
                    }

                    return (
                        require.cache[requirePath]!.exports = omit(
                            Object.assign({}, exports, resolvedMod),
                            ["__esModule", "default"],
                        )
                    );
                };

                return resolveFn as TranspilerReturn<TProject>;
            }
        } finally {
            if (restore) restore();
        }
    };
};