import get from "lodash/get";
import set from "lodash/set";

import { getRegisterOptions } from "@settings/register";
import { getDebugLogger, Debugger } from "@util/output";
import { arrayify } from "@util/objects";

import {
    processPlugins,
    PluginTranspileType,
} from "@lib/process-plugins";
import { processApiModule } from "@lib/api-module";

import {
    getTranspiler,
    Transpiler,
    ImportHandler,
} from "./transpiler";
import {
    ProjectSettings,
    IInitSettings,
} from "./project-settings";
import { ProjectModule } from "./project-module";

import type {
    TranspileType,
    TranspilerOptions,
    ApiType,
    ProjectMetaFn,
    PropertyBag,
    PluginModule,
    GatsbyPlugin,
    IPluginDetailsCallback,
    IGatsbyPluginWithOpts,
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
        debug?: Debugger,
    ): Project<T> {
        const { apiType = "config" } = input;

        const useDebug = (
            debug?.new("Project") ||
            getDebugLogger(`Project:${apiType}`)
        );

        const {
            changed: settingsChanged,
            settings,
        } = ProjectSettings.getInstance(apiType, input, setCache);
        const { projectRoot } = settings.projectMeta;
        const cachedProject = getProjectCache(apiType, projectRoot);

        if (cachedProject) useDebug(`Found cached project:`, apiType, projectRoot);

        const projectModule = ProjectModule.getModule(
            apiType,
            projectRoot,
            cachedProject?.debug.new("Project") || useDebug,
        );

        const useProject = settingsChanged || !cachedProject
            ? new Project(
                apiType,
                settings,
                projectModule,
                debug || useDebug,
            )
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
    public getProject: typeof Project["getProject"] = (...args) => (
        Project.getProject(...args)
    )

    private _transpiler!: Transpiler;
    private _registerOptions!: TranspilerOptions<TranspileType>;

    private constructor(
        public readonly apiType: TApiType,
        protected readonly settings: ProjectSettings,
        private projectModule: ProjectModule<TApiType>,
        public debug: Debugger,
    ) {}

    public get projectName() { return this.projectMeta.projectName; }
    public get projectRoot() { return this.projectMeta.projectRoot; }
    public get options() { return this.settings.options; }
    public get projectMeta() { return this.settings.projectMeta; }
    public get propBag() { return this.settings.propBag; }

    public get module() { return this.projectModule.module; }

    public get requirePath() { return this.projectModule.requirePath; }
    public set requirePath(val) {
        this.projectModule.requirePath = val;
    }

    public get finalized() {
        return this.projectModule.finalized;
    }
    public finalizeProject(mod: PluginModule<TApiType> | unknown) {
        this.projectModule.finalize(mod);
    }

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
            this.debug.new(`clone:${newApiType}`),
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

    public resolveConfigFn<
        C extends ProjectMetaFn<ApiType>
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

    public processPlugins(
        type: PluginTranspileType,
        plugins: GatsbyPlugin[] | IPluginDetailsCallback<any, any>,
    ): IGatsbyPluginWithOpts[] {
        const usePlugins = (
            Array.isArray(plugins) ||
            typeof plugins === "function"
        ) && arrayify(plugins) || [];

        return processPlugins(usePlugins, this, processApiModule, type);
    }
}