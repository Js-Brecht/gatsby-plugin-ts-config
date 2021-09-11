import path from "path";

import { createProjectMetaFn } from "@util/project-meta";
import { omit } from "@util/objects";
import { isProjectMetaFn } from "@util/type-util";
import { preferDefault } from "@util/node";
import { resolveFilePath } from "@util/fs-tools";

import { Serializer } from "@lib/serializer";
import { setTranspiler } from "./set-transpiler";

import type { Project } from "@lib/project";
import type {
    ApiType,
    TranspilerArgs,
    TranspileType,
    InitValue,
    TranspilerReturn,
    ProjectPluginModule,
} from "@typeDefs";

export { ImportHandler } from "./import-handler";
export type { ImportHandlerFn } from "./import-handler";

export type Transpiler<TProject extends Project<ApiType> = Project> = {
    enable: (key?: string | undefined, args?: TranspilerArgs<TranspileType> | undefined) => (
        ReturnType<typeof setTranspiler>
    );
    transpile: <
        T extends TranspileType = "babel"
    >(
        init: InitValue,
        overrideArgs?: TranspilerArgs<T>,
    ) => TranspilerReturn<TProject>;
}

export const getTranspiler = <TProject extends Project<ApiType>>(
    project: TProject,
    rootArgs: TranspilerArgs<TranspileType>,
): Transpiler<TProject> => {
    const rootKey = Serializer.serialize(rootArgs)!;

    const doSetTranspiler = (key?: string, args?: TranspilerArgs<TranspileType>) => (
        setTranspiler(
            key || rootKey,
            args || rootArgs,
            project,
        )
    );

    return {
        enable: doSetTranspiler,
        transpile: function transpile(init, overrideArgs) {
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

            const restore = doSetTranspiler(transpilerKey, transpilerArgs);

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

                    const removeUnwanted = (mod: any) => (
                        omit(mod, ["__esModule", "default"])
                    );

                    const updateExports = () => {
                        let newObj: Record<string, unknown> | Function = {};
                        let initialObj: Record<string, unknown> = {};
                        let extendObj: Record<string, unknown> = {};

                        if (typeof mod === "function") {
                            newObj = (...args: any) => mod(...args);
                        } else if (typeof resolvedMod === "function") {
                            newObj = (...args: any) => (resolvedMod as Function)(...args);
                        }

                        if (typeof mod === "object") {
                            initialObj = removeUnwanted(mod);
                        }
                        if (typeof resolvedMod === "object") {
                            extendObj = removeUnwanted(resolvedMod) as Record<string, unknown>;
                        }

                        return require.cache[requirePath]!.exports = Object.assign(
                            newObj,
                            initialObj,
                            extendObj,
                        );
                    };

                    const isNodeFunction = project.apiType === "node";

                    if (isProjectMetaFn(project, resolvedMod, isNodeFunction)) {
                        return createProjectMetaFn((opts, props) => {

                            // So much for TS 4.4.2 contextual flow analysis
                            if (isProjectMetaFn(project, resolvedMod, isNodeFunction)) {
                                resolvedMod = resolvedMod(opts, props);
                            }

                            return updateExports() as ProjectPluginModule<TProject>;
                        });
                    }

                    return updateExports() as TranspilerReturn<TProject>;
                }
            } finally {
                if (restore) restore();
            }
        },
    };
};