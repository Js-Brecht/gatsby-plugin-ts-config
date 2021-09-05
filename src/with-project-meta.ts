import { createProjectMetaFn } from "@util/project-meta";
import { PluginError } from "@util/output";

import { processApiModule } from "./lib/api-module";
import { Project } from "./lib/project";
import type { ApiType, ProjectMetaFn, PluginModule, PropertyBag } from "@typeDefs";

type WithGatsbyTsMeta<T extends ApiType> = <TProps extends PropertyBag>(
    cb: ProjectMetaFn<T, TProps>,
) => PluginModule<T>

const withProjectMeta = <T extends ApiType, TProps extends PropertyBag>(
    apiType: T,
    cb: ProjectMetaFn<T, TProps>,
): PluginModule<T> => {
    const project = Project.getProject(
        { apiType },
        true,
        false,
    );

    try {
        return processApiModule({
            init: () => createProjectMetaFn(cb),
            project,
        }) as PluginModule<T>;
    } catch (err: any) {
        throw new PluginError(err);
    }
};

const wrapProjectMeta = <
    T extends ApiType
>(apiType: T): WithGatsbyTsMeta<T> => (cb) => (
    withProjectMeta(apiType, cb)
);

/**
 * Passes metadata collected on the current project to the
 * provided callback.
 *
 * The callback should return the proper `gatsby-config` structure
 * that Gatsby is relying on.
 *
 * Callback receives in its parameters:
 *
 * 1. Metadata for the current project
 * 2. The property bag for the current project
 */
export const withProjectMetaConfig = wrapProjectMeta("config");

/**
 * Passes metadata collected on the current project to the
 * provided callback.
 *
 * The callback should return correct `gatsby-node` APIs
 *
 * Callback receives in its parameters:
 *
 * 1. Metadata for the current project
 * 2. The property bag for the current project
 */
export const withProjectMetaNode = wrapProjectMeta("node");
