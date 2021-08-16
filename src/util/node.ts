import {
    createRequire as nodeCreateRequire,
    createRequireFromPath as nodeCreateRequireFromPath,
} from "module";
import BuiltinModule from "module";
import type { PluginModule, ApiType } from "@typeDefs/internal";
import type { TSConfigFn } from "@typeDefs/public";

type ModuleType<T extends ApiType> = PluginModule<T> | {
    default: TSConfigFn<T>;
}

export const preferDefault = <
    T extends ApiType
>(mod: ModuleType<T>): PluginModule<T> | TSConfigFn<T> => (
    (
        mod &&
        "default" in mod &&
        mod.default ||
        mod
    ) as PluginModule<T> | TSConfigFn<T>
);

export const createRequire = nodeCreateRequire || nodeCreateRequireFromPath;

interface IModule extends BuiltinModule {
    _extensions: NodeJS.RequireExtensions;
}

export const Module = BuiltinModule as unknown as IModule;