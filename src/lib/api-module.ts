import { Project } from "@lib/project";
import { isGatsbyConfig } from "@util/type-util";
import { preferDefault } from "@util/node";
import { resolveFilePath } from "@util/fs-tools";
import { isGatsbyTsMetaFn } from "@util/gatsby-ts-meta";

import { processPluginCache } from "./process-plugins";

import type {
    InitValue,
    ProjectPluginModule,
    TSConfigFn,
    TranspilerReturn,
} from "@typeDefs";

interface IProcessApiModuleOptions<T extends Project> {
    init: InitValue;
    project: T;
}

export type ApiModuleProcessor = typeof processApiModule;

export const processApiModule = <T extends Project>({
    init,
    project,
}: IProcessApiModuleOptions<T>): ProjectPluginModule<T> => {
    const projectRoot = project.projectRoot;
    const apiType = project.apiType;

    if (project.finalized) return project.module as ProjectPluginModule<T>;

    const {
        resolveImmediate = true,
    } = project.getApiOptions(apiType);

    let apiModule = preferDefault(
        project.transpiler(init),
    ) as TranspilerReturn<T>;

    let gatsbyNode: TSConfigFn<"node"> | undefined = undefined;
    let gatsbyNodeProject: Project<"node"> | undefined = undefined;

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
            project.setApiOption("node", "resolveImmediate", false);
            gatsbyNodeProject = project.clone("node");

            gatsbyNode = processApiModule({
                init: gatsbyNodePath,
                project: gatsbyNodeProject,
            }) as TSConfigFn<"node">;

            gatsbyNodeProject = Project.getProject({
                apiType: "node",
            }, false);
            project.setApiOption("node", "resolveImmediate", true);
        }
    }

    if (isGatsbyTsMetaFn(project, apiModule) && resolveImmediate) {
        apiModule = project.resolveConfigFn(apiModule) as ProjectPluginModule<T>;
    }

    if (gatsbyNodeProject && gatsbyNode && isGatsbyTsMetaFn(project, gatsbyNode)) {
        gatsbyNodeProject.resolveConfigFn(gatsbyNode);
    }

    if (!apiModule) apiModule = {};

    /**
     * Time to transpile/process local plugins
     */
    if (isGatsbyConfig(apiType, apiModule) && typeof apiModule === "object") {
        apiModule.plugins = processPluginCache(
            project,
            processApiModule,
            apiModule.plugins,
        );
    }

    if (resolveImmediate) {
        project.finalizeProject(apiModule);
    }

    return apiModule as ProjectPluginModule<T>;
};