import { preferDefault } from "./node";

import type { Project } from "@lib/project";
import { projectMetaSymbol } from "./project-meta";

import type {
    ApiType,
    TranspileType,
    PluginModule,
    ProjectMetaFn,
    TranspilerReturn,
    ProjectApiType,
    BaseModuleType,
} from "@typeDefs";

export const isBabelType = (type: TranspileType): type is "babel" => (
    type === "babel"
);
export const isTsNodeType = (type: TranspileType): type is "ts-node" => (
    type === "ts-node"
);

export const isGatsbyConfig = (
    type: ApiType,
    mod: PluginModule<any>,
): mod is PluginModule<"config", true> => (
    type === "config"
);


export const isProjectMetaFn = <
    T extends Project,
    TApiType extends ApiType = ProjectApiType<T>
>(
    project: T,
    mod: BaseModuleType<TApiType> | TranspilerReturn<T>,
    force?: boolean,
): mod is ProjectMetaFn<TApiType> => !!(
    mod &&
    (
        (force && typeof preferDefault(mod as BaseModuleType<TApiType>) === "function") ||
        projectMetaSymbol in preferDefault(mod as BaseModuleType<TApiType>)
    )
);