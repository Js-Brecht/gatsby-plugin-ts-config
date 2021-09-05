import { createGatsbyTsMetaFn } from "@util/gatsby-ts-meta";
import { PluginError } from "@util/output";

import { processApiModule } from "./api-module";
import { Project } from "./project";
import type { ApiType, TSConfigFn, PluginModule } from "@typeDefs";

export const withGatsbyTsMeta = <T extends ApiType>(
    apiType: T,
    cb: TSConfigFn<T>,
): PluginModule<T> => {
    const project = Project.getProject(
        { apiType },
        true,
        true,
    );

    try {
        return processApiModule({
            init: () => createGatsbyTsMetaFn(cb),
            project,
        }) as PluginModule<T>;
    } catch (err: any) {
        throw new PluginError(err);
    }
};