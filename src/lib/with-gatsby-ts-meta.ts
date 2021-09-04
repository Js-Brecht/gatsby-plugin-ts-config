import { processApiModule } from "./api-module";
import { Project } from "./project";
import type { ApiType, TSConfigFn } from "@typeDefs";

export const withGatsbyTsMeta = <T extends ApiType>(
    apiType: ApiType,
    cb: TSConfigFn<T>,
) => {
    const project = Project.getProject(
        { apiType },
        true,
        true,
    );

    processApiModule();
};