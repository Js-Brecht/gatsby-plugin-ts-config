import { GatsbyTsOptions } from "@typeDefs";
export * from "./types/public";

// export {
//     useGatsbyConfig,
//     useGatsbyNode,
// } from "./use-gatsby-api";
export {
    withMetaConfig,
    withMetaNode,
} from "./with-project-meta";
export {
    loadPluginsDeferred,
    // loadPlugins,
} from "./include-plugins";
export type { LoadPluginFn } from "./include-plugins";

export const createOptions = (options: GatsbyTsOptions) => options;
