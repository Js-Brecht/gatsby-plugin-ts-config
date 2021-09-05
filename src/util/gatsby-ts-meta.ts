import { preferDefault } from "./node";

import type { Project } from "@lib/project";
import type {
    TSConfigFn,
    ApiType,
    TranspilerReturn,
    ProjectApiType,
    ProjectPluginModule,
    BaseModuleType,
} from "@typeDefs";

export const gatsbyTsMeta = Symbol("gatsby_ts_meta_function");

export const createGatsbyTsMetaFn = <
    T extends TSConfigFn<ApiType>
>(cb: T): TSConfigFn<ApiType> => {
    cb[gatsbyTsMeta] = true;
    return cb;
};

export const isGatsbyTsMetaFn = <
    T extends Project,
    TApiType extends ApiType = ProjectApiType<T>
>(
    project: T,
    mod: BaseModuleType<TApiType> | TranspilerReturn<T>,
): mod is TSConfigFn<TApiType> => !!(
    mod && gatsbyTsMeta in preferDefault(mod as BaseModuleType<TApiType>)
);