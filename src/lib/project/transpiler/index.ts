import path from "path";
import omit from "lodash/omit";

import { createGatsbyTsMetaFn, isGatsbyTsMetaFn } from "@util/gatsby-ts-meta";
import { preferDefault } from "@util/node";
import { resolveFilePath } from "@util/fs-tools";

import { Serializer } from "@lib/serializer";
import { setTranspiler } from "./set-transpiler";

import type { Project } from "@lib/project";
import type {
    TranspilerArgs,
    TranspileType,
    InitValue,
    TranspilerReturn,
    TSConfigFn,
} from "@typeDefs";

export { ImportHandler } from "./import-handler";
export type { ImportHandlerFn } from "./import-handler";

export type Transpiler<TProject extends Project<any> = Project> = <
    T extends TranspileType = "babel"
>(
    init: InitValue,
    overrideArgs?: TranspilerArgs<T>,
) => TranspilerReturn<TProject>;

export const getTranspiler = <TProject extends Project<any>>(
    project: TProject,
    rootArgs: TranspilerArgs<TranspileType>,
): Transpiler<TProject> => {
    const rootKey = Serializer.serialize(rootArgs)!;

    return function transpile(init, overrideArgs) {
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
                const requirePath = project.requirePath || (
                    project.requirePath = resolveFilePath(
                        projectRoot,
                        path.resolve(projectRoot, init),
                    )
                );

                if (!requirePath) {
                    throw new Error([
                        `Unable to resolve module '${init}' from`,
                        `Path: ${projectRoot}`,
                    ].join("\n"));
                }

                const mod = require(requirePath);
                let resolvedMod = preferDefault(mod);

                if (!require.cache[requirePath]) {
                    throw new Error([
                        `Unable to retrieve require cache for module '${requirePath}'.`,
                        "This may indicate a serious issue",
                    ].join("\n"));
                }

                const updateExports = () => {
                    let newObj: Record<string, unknown> | Function = {};
                    let initialObj: Record<string, unknown> = {};
                    let extendObj: Record<string, unknown> = {};

                    if (typeof mod === "function") {
                        newObj = (...args: any) => mod(...args);
                    } else if (typeof resolvedMod === "function") {
                        newObj = (...args: any) => (resolvedMod as Function)(...args);
                    } else {
                        if (typeof mod === "object") {
                            initialObj = mod;
                        }
                        if (typeof resolvedMod === "object") {
                            extendObj = resolvedMod as Record<string, unknown>;
                        }
                    }

                    return require.cache[requirePath].exports = omit(
                        Object.assign(newObj, initialObj, extendObj),
                        ["__esModule", "default"],
                    );
                };


                if (isGatsbyTsMetaFn(project, resolvedMod)) {
                    return createGatsbyTsMetaFn((opts, props) => {
                        if (isGatsbyTsMetaFn(project, resolvedMod)) {
                            resolvedMod = resolvedMod(opts, props);
                        }

                        return updateExports();
                    });
                }

                return updateExports() as TranspilerReturn<TProject>;
            }
        } finally {
            if (restore) restore();
        }
    };
};