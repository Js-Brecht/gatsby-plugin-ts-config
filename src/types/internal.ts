import type { GatsbyConfig, GatsbyNode } from "gatsby";
import type { TransformOptions as BabelOptions } from "@babel/core";
import type { RegisterOptions as TSNodeOptions } from "ts-node";
import type { JsonObject } from "type-fest";

import type { apiTypeKeys } from "@util/constants";
import type { PublicOpts, GatsbyPlugin } from "./public";

export type IgnoreFn = (filename: string) => boolean;
export type IgnoreHookFn = (filename: string, original: boolean) => (
    boolean | void
);

export type Hooks = {
    ignore?: IgnoreHookFn[];
}

export type PropertyBag = JsonObject;
export type ApiType = typeof apiTypeKeys[number];
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

export type InitValue = string | (() => Record<string, unknown>);
export type NoFirstParameter<T> = (
    T extends (first: any, ...args: infer U) => infer R
        ? (...args: U) => R
        : T
);

export type TranspilerOptions<T extends TranspileType> =
    T extends "babel"
        ? BabelOptions
        : T extends "ts-node"
            ? TSNodeOptions
            : never;

export type ApiImports = {
    [K in ApiType]?: string[];
};
export type PluginImports<T = ApiImports> = Record<string, T>;
export type RootPluginImports = ApiImports & {
    plugins?: PluginImports;
};
export type ImportsCache = PluginImports<RootPluginImports>;

export type PluginModule<T extends ApiType> =
    T extends "config"
        ? GatsbyConfig
        : T extends "node"
            ? GatsbyNode
            : unknown;

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