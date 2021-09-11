import get from "lodash/get";
import set from "lodash/set";

import { Debugger } from "@util/output";

import {
    ApiType,
    PluginModule,
} from "@typeDefs";

type ProjectModuleCache = {
    [projectRoot: string]: {
        [apiType in ApiType]?: ProjectModule<ApiType>;
    }
}

const projectModuleCache: ProjectModuleCache = {};

export class ProjectModule<TApiType extends ApiType> {
    public static getModule<T extends ApiType>(
        apiType: ApiType,
        projectRoot: string,
        debug: Debugger,
    ): ProjectModule<T> {
        const projectModuleDebug = debug.new(`ProjectModule`);
        let projectModule = get(projectModuleCache, [projectRoot, apiType]);
        if (projectModule) {
            projectModuleDebug("Found module instance:", apiType, projectRoot);
            return projectModule;
        }

        set(
            projectModuleCache,
            [projectRoot, apiType],
            projectModule = new ProjectModule(),
        );

        projectModuleDebug("Creating new module instance", apiType, projectRoot);

        return projectModule;
    }


    public requirePath?: string | false;
    private _module?: PluginModule<TApiType>;

    public get module() { return this._module; }
    public get finalized(): boolean {
        // Gatsby deletes the `require.cache` instance in dev sometimes...
        // in that case, we need to re-transpile.
        if (this.requirePath && !require.cache[this.requirePath]) return false;
        if (this.module) return true;
        return false;
    }
    public finalize(mod: PluginModule<TApiType> | unknown) {
        this._module = mod as PluginModule<TApiType>;
    }
}