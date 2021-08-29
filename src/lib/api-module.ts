import { isGatsbyConfig } from "@util/type-util";
import { preferDefault } from "@util/node";
import { resolveFilePath } from "@util/fs-tools";

import { processPluginCache } from "./process-plugins";

import type { Project } from "@lib/project";
import type {
    ApiType,
    InitValue,
    PluginModule,
    TSConfigFn,
} from "@typeDefs";

interface IProcessApiModuleOptions<T extends ApiType> {
    apiType: T;
    init: InitValue;
    project: Project;
}

export type ApiModuleProcessor = typeof processApiModule;

export const processApiModule = <
    T extends ApiType
>({
    apiType,
    init,
    project,
}: IProcessApiModuleOptions<T>) => {
    const { projectRoot, projectName } = project.projectMeta;

    const { resolveImmediate = true } = project.getApiOptions(apiType);

    let apiModule = preferDefault(
        project.transpiler<T>(
            apiType,
            init,
            projectName,
            projectRoot,
            projectRoot,
        ),
    );

    let gatsbyNode: TSConfigFn<"node"> | undefined = undefined;

    if (apiType === "config") {
        const gatsbyNodePath = resolveFilePath(projectRoot, "./gatsby-node");

        /**
         * We want to pre-process `gatsby-node` from `gatsby-config` because:
         *
         * 1. We want to get all of the chained imports from `gatsby-node`; and,
         * 2. We want to transpile it in case it is a `.ts` file, so that Gatsby
         *    can consume it.
         */
        if (gatsbyNodePath) {
            project.setApiOptions("node", { resolveImmediate: false });
            gatsbyNode = processApiModule({
                apiType: "node",
                init: gatsbyNodePath,
                project,
            }) as TSConfigFn<"node">;
            project.setApiOptions("node", {});
        }
    }


    if (typeof apiModule === "function" && resolveImmediate) {
        apiModule = project.resolveConfigFn(apiModule) as PluginModule<T>;
    }

    if (typeof gatsbyNode === "function") {
        project.resolveConfigFn(gatsbyNode);
    }

    if (!apiModule) apiModule = {};

    /**
     * Time to transpile/process local plugins
     */
    if (isGatsbyConfig(apiType, apiModule) && typeof apiModule === "object") {
        const gatsbyConfig = apiModule as PluginModule<"config">;
        gatsbyConfig.plugins = processPluginCache(
            project,
            processApiModule,
            gatsbyConfig.plugins,
        );
    }

    return apiModule as PluginModule<T>;
};