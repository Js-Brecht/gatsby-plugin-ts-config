import get from "lodash/get";
import set from "lodash/set";

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
    ): ProjectModule<T> {
        let projectModule = get(projectModuleCache, [projectRoot, apiType]);
        if (projectModule) return projectModule;
        set(
            projectModuleCache,
            [projectRoot, apiType],
            projectModule = new ProjectModule(),
        );

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