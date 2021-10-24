import { GatsbyTsOptions } from "@typeDefs";
export * from "./types/public";

// export {
//     useGatsbyConfig,
//     useGatsbyNode,
// } from "./use-gatsby-api";
export {
    withProjectMetaConfig,
    withProjectMetaNode,
} from "./with-project-meta";
export {
    includePlugins,
    getPlugins,
} from "./include-plugins";
export type { GetPluginFn } from "./include-plugins";

export const createOptions = (options: GatsbyTsOptions) => options;
