import get from "lodash/get";
import set from "lodash/set";

import {
    getTranspiler,
    Transpiler,
    ImportHandler,
    ImportHandlerFn,
} from "./transpiler";

import { getRegisterOptions } from "@settings/register";

import {
    ProjectSettings,
    IInitSettings,
} from "./project-settings";

import type {
    TranspileType,
    TranspilerOptions,
    ApiType,
    TSConfigFn,
    PropertyBag,
    PluginModule,
} from "@typeDefs";

interface IGetProjectSettings extends IInitSettings {
    apiType?: ApiType;
}

interface IModuleOptions {
    resolveImmediate?: boolean;
}

type ApiOptions = {
    [projectRoot: string]: {
        [api in ApiType]?: IModuleOptions;
    }
}

const apiOptionsCache: ApiOptions = {};

type ProjectCache = {
    [projectRoot: string]: {
        [apiType in ApiType]?: Project;
    }
}

const projectCache: ProjectCache = {};

const setProjectCache = (
    apiType: ApiType,
    projectRoot: string,
    project: Project,
) => (
    set(projectCache, [projectRoot, apiType], project),
    project
);
const getProjectCache = (
    apiType: ApiType,
    projectRoot: string,
) => (
    get(projectCache, [projectRoot, apiType])
);

export class Project<TApiType extends ApiType = ApiType> {
    public static getProject<T extends ApiType = "config">(
        input: Partial<IGetProjectSettings>,
        setCache: boolean,
        forceCache = false,
    ): Project<T> {
        const { apiType = "config" } = input;

        const {
            changed: settingsChanged,
            settings,
        } = ProjectSettings.getInstance(apiType, input, setCache);
        const { projectRoot } = settings.projectMeta;

        const cachedProject = getProjectCache(apiType, projectRoot);
        const useProject = settingsChanged || !cachedProject
            ? new Project(apiType, settings)
            : cachedProject!;

        // Only cache the first requested one.
        if ((setCache || forceCache) && !cachedProject) {
            setProjectCache(
                apiType,
                projectRoot,
                useProject,
            );
        }

        return useProject as Project<T>;
    }

    public requirePath?: string | false;

    private _transpiler!: Transpiler;
    private _registerOptions!: TranspilerOptions<TranspileType>;
    private _module?: PluginModule<TApiType>;

    private constructor(
        public readonly apiType: TApiType,
        protected readonly settings: ProjectSettings,
    ) {}

    public get projectName() { return this.projectMeta.projectName; }
    public get projectRoot() { return this.projectMeta.projectRoot; }
    public get options() { return this.settings.options; }
    public get projectMeta() { return this.settings.projectMeta; }
    public get propBag() { return this.settings.propBag; }

    public get module() { return this._module; }

    /**
     * Creates & stores a transpiler function instance.
     *
     * Successive calls to this getter will always return the same value
     */
    public get transpiler(): Transpiler {
        if (!this._transpiler) {
            this._transpiler = getTranspiler(this, {
                type: this.options.type || "babel",
                options: this.registerOptions,
            });
        }

        return this._transpiler;
    }

    /**
     * Stores & returns the options for the `register()` function.
     *
     * Successive calles to this getter will always return the same value.
     */
    public get registerOptions(): TranspilerOptions<TranspileType> {
        if (!this._registerOptions) {
            const {
                type,
                transpilerOptions,
            } = this.options;

            this._registerOptions = getRegisterOptions(
                this.projectRoot,
                type || "babel",
                transpilerOptions || {},
            );
        }

        return this._registerOptions;
    }

    /**
     * Clones the current project, with a new ApiType.
     *
     * If an instance already exists for the `ApiType` with settings that match these new ones,
     * that cached instance will be used.
     */
    public clone<T extends ApiType>(
        newApiType: T,
        newProps = {} as PropertyBag,
    ) {
        return Project.getProject<T>(
            {
                ...this.settings,
                apiType: newApiType,
                propBag: newProps,
            },
            false,
            false,
        );
    }

    /**
     * Set persisted option for a (possibly) different api module.
     *
     * These are globally accessible for the current project.
     */
    public setApiOption<K extends keyof IModuleOptions>(
        apiType: ApiType,
        option: K,
        value: IModuleOptions[K],
    ) {
        set(apiOptionsCache, [this.projectRoot, apiType, option], value);
    }

    /**
     * Returns the collection of options for the desired `ApiType`
     */
    public getApiOptions(apiType: ApiType): IModuleOptions {
        return get(apiOptionsCache, [this.projectRoot, apiType], {});
    }

    /**
     * Returns a specific option for the desired `ApiType`.
     */
    public getApiOption<K extends keyof IModuleOptions>(
        apiType: ApiType,
        option: K,
    ): IModuleOptions[K] {
        return get(apiOptionsCache, [this.projectRoot, apiType, option]);
    }

    public linkPluginImports(pluginName: string) {
        return ImportHandler.linkProjectPlugin(this.projectName, pluginName);
    }

    public get finalized(): boolean {
        // Gatsby deletes the `require.cache` instance in dev sometimes...
        // in that case, we need to re-transpile.
        if (this.requirePath && !require.cache[this.requirePath]) return false;
        if (this._module) return true;
        return false;
    }
    public finalizeProject(mod: PluginModule<TApiType> | unknown) {
        this._module = mod as PluginModule<TApiType>;
    }
    public resolveConfigFn<
        C extends TSConfigFn<ApiType>
    >(cb: C, project?: Project) {
        return cb(
            {
                projectRoot: this.projectRoot,
                imports: ImportHandler.getProjectImports(
                    project?.projectName || this.projectName,
                ),
            },
            this.propBag,
        );
    }
}