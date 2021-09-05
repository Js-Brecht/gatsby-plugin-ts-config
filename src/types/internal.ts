import type { GatsbyConfig, GatsbyNode } from "gatsby";
import type { TransformOptions as BabelOptions } from "@babel/core";
import type { RegisterOptions as TSNodeOptions } from "ts-node";
import type { JsonObject } from "type-fest";

import type { apiTypeKeys } from "@util/constants";
import type { Project } from "@lib/project";
import type { PublicOpts, GatsbyPlugin, TSConfigFn } from "./public";

export type IgnoreFn = (filename: string) => boolean;
export type IgnoreHookFn = (filename: string, original: boolean) => (
    boolean | void
);

export type Hooks = {
    ignore?: IgnoreHookFn[];
}

export type PropertyBag = JsonObject;
export type ApiType = typeof apiTypeKeys[number];
export type ProjectApiType<T extends Project> = (
    T extends Project<infer TApiType>
        ? TApiType
        : never
)

export type TranspileType = "babel" | "ts-node";
export type TranspilerArgs<
    T extends TranspileType = "babel"
> = {
    type: T;
    options: TranspilerOptions<T>
}
export interface IInternalOptions {
    props?: PropertyBag;
    type?: TranspileType;
    hooks?: Hooks;
}

interface IInternalBabelOptions extends IInternalOptions {
    type?: "babel";
    transpilerOptions?: BabelOptions;
}
interface IInternalTsNodeOptions extends IInternalOptions {
    type?: "ts-node";
    transpilerOptions?: TSNodeOptions;
}

export type TsConfigPluginOptions = (
    | IInternalBabelOptions
    | IInternalTsNodeOptions
);
export type PluginOptionDiff = Omit<TsConfigPluginOptions, "props">;

export type InitValue<T extends ApiType = ApiType> = string | (() => PluginModule<T> | TSConfigFn<T>);
export type NoFirstParameter<T> = (
    T extends (first: any, ...args: infer U) => infer R
        ? (...args: U) => R
        : T
);

export type BaseModuleType<T extends ApiType> = PluginModule<T> | TSConfigFn<T> | {
    default: TSConfigFn<T>;
}

export type TranspilerOptions<T extends TranspileType> =
    T extends "babel"
        ? BabelOptions
        : T extends "ts-node"
            ? TSNodeOptions
            : never;

export type TranspilerReturn<TProject extends Project<any>> = (
    BaseModuleType<ProjectApiType<TProject>>
)

export type ApiImports = {
    [K in ApiType]?: string[];
};
export type PluginImports<T = ApiImports> = Record<string, T>;
export type RootPluginImports = ApiImports & {
    plugins?: PluginImports;
};
export type ImportsCache = PluginImports<RootPluginImports>;

export type PluginModule<T extends ApiType, TTheme = true> =
    T extends "config"
        ? TTheme extends false
            ? GatsbyConfig
            : GatsbyConfig | ((args: Record<string, any>) => GatsbyConfig)
        : T extends "node"
            ? GatsbyNode
            : unknown;
export type ProjectPluginModule<
    T extends Project,
    TTheme = true,
> = (
    PluginModule<ProjectApiType<T>, TTheme>
)

export interface IPluginDetailsCallback<
    TReturn extends GatsbyPlugin = GatsbyPlugin,
    TProps extends PropertyBag = PropertyBag,
> {
    (args: PublicOpts, props: TProps): TReturn[];
}

export interface IGatsbyPluginWithOpts<
    TName extends string = string,
    TOptions extends Record<string, any> = Record<string, any>
> {
    resolve: TName;
    options?: TOptions;
}

export type GetApiType<T extends PluginModule<ApiType> | TSConfigFn<ApiType>> = (
    T extends PluginModule<infer U> ? U : (
        T extends TSConfigFn<infer U> ? U : (
            never
        )
    )
)