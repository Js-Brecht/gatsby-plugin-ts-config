import {
    createRequire as nodeCreateRequire,
    createRequireFromPath as nodeCreateRequireFromPath,
} from "module";
import BuiltinModule from "module";
import type { ApiType, PluginModule, BaseModuleType } from "@typeDefs/internal";
import type { ProjectMetaFn } from "@typeDefs/public";

export const preferDefault = <T extends ApiType>(mod: BaseModuleType<T>) => (
    mod && "default" in mod && mod.default || mod
) as PluginModule<T> | ProjectMetaFn<T>;

export const createRequire = nodeCreateRequire || nodeCreateRequireFromPath;

interface IModule extends BuiltinModule {
    _extensions: NodeJS.RequireExtensions;
}

export const Module = BuiltinModule as unknown as IModule;