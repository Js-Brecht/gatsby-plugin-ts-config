import get from "lodash/get";
import set from "lodash/set";
import pick from "lodash/pick";
import isEqual from "lodash/isEqual";

import { merge } from "@util/objects";
import { getProject, ProjectMeta } from "@util/project";
import { getTranspiler, Transpiler } from "@lib/transpiler";

import { ImportHandler, ImportHandlerFn } from "@settings/import-handler";
import { getRegisterOptions } from "@settings/register";
import { getPropBag } from "@settings/prop-bag";

import type {
    TsConfigPluginOptions,
    TranspileType,
    TranspilerOptions,
    PropertyBag,
    ApiType,
    TSConfigFn,
} from "@typeDefs";

type ProjectOptions = Omit<TsConfigPluginOptions, "props">;

interface IInitSettings {
    apiType?: ApiType;
    projectMeta: ProjectMeta;
    options?: ProjectOptions;
    propBag?: PropertyBag;
}

interface IBaseProjectSettings extends Required<IInitSettings> {}

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
    projectRoot: string,
    apiType: ApiType,
    project: Project,
) => (
    set(projectCache, [projectRoot, apiType], project),
    project
);
const getProjectCache = (
    projectRoot: string,
    apiType: ApiType,
    fallback?: ApiType,
) => (
    get(projectCache, [projectRoot, apiType]) || (
        fallback &&
        get(projectCache, [projectRoot, fallback])
    )
);

export class Project {
    public static getProject(input = {} as Partial<IInitSettings>) {
        const settings = input as IBaseProjectSettings;

        if (!settings.apiType) settings.apiType = "config";
        if (!settings.options) settings.options = {};

        const propBag = (
            settings.propBag ||
            (settings.options as TsConfigPluginOptions).props
        );
        settings.propBag = propBag;
        delete (settings.options as TsConfigPluginOptions).props;

        const apiType = settings.apiType;
        if (!settings.projectMeta) {
            settings.projectMeta = getProject();
        }

        const {
            projectRoot,
        } = settings.projectMeta;

        const initialProject = getProjectCache(
            projectRoot,
            "config",
            "node",
        );

        const project = getProjectCache(
            projectRoot,
            apiType,
        );

        if (
            initialProject && (
                !project ||
                initialProject.apiType !== project.apiType
            )
        ) {
            const diffKeys: Array<keyof TsConfigPluginOptions> = [
                "hooks",
                "type",
                "transpilerOptions",
            ];
            const configOptions = pick(initialProject.options, diffKeys);
            const options = pick(settings.options, diffKeys);

            /**
             * The settings haven't changed.  Don't need a separate Project instance
             */
            if (isEqual(configOptions, options)) {
                return initialProject.merge(settings);
            }

            /**
             * If this new project instance is using the same kind of transpiler,
             * merge in the settings from the original instance
             */
            if (configOptions.type === options.type) {
                merge(
                    settings.options.transpilerOptions,
                    configOptions.transpilerOptions,
                    options.transpilerOptions,
                );
            }
        }

        return project?.merge(settings) || setProjectCache(
            projectRoot,
            apiType,
            new Project(settings),
        );
    }

    /**
     * This is only used for tracking how this Project instance was created.
     * It should not be used externally, because `getProject()` may not return
     * the `Project` with an `apiType` you are expecting.
     */
    protected readonly apiType: ApiType;
    public readonly options: ProjectOptions;
    public readonly projectMeta: ProjectMeta;
    public readonly propBag: PropertyBag;

    private _transpiler!: Transpiler;
    private _registerOptions!: TranspilerOptions<TranspileType>;

    private constructor(settings: IBaseProjectSettings) {
        this.projectMeta = settings.projectMeta;
        this.propBag = getPropBag(this.projectMeta.projectRoot, settings.propBag);
        this.apiType = settings.apiType!;
        this.options = settings.options;
    }

    public merge(settings: IInitSettings) {
        merge(this.propBag, settings.propBag);
        return this;
    }

    public get transpiler(): Transpiler {
        if (!this._transpiler) {
            this._transpiler = getTranspiler(this, {
                type: this.options.type || "babel",
                options: this.registerOptions,
            });
        }

        return this._transpiler;
    }

    public get registerOptions(): TranspilerOptions<TranspileType> {
        if (!this._registerOptions) {
            const { projectRoot } = this.projectMeta;
            const {
                type,
                transpilerOptions,
            } = this.options;

            this._registerOptions = getRegisterOptions(
                projectRoot,
                type || "babel",
                transpilerOptions || {},
            );
        }

        return this._registerOptions;
    }

    public setApiOptions(apiType: ApiType, opts: IModuleOptions) {
        const { projectRoot } = this.projectMeta;
        set(apiOptionsCache, [projectRoot, apiType], merge(
            {},
            this.getApiOptions(apiType),
            opts,
        ));
    }
    public getApiOptions(apiType: ApiType): IModuleOptions {
        const { projectRoot } = this.projectMeta;
        return get(apiOptionsCache, [projectRoot, apiType], {});
    }

    public get importHandler() {
        return ImportHandler.getCurrent(this.projectMeta.projectName);
    }
    public pushImportHandler(apiType: ApiType) {
        return ImportHandler.push(apiType, this.projectMeta.projectName);
    }
    public popImportHandler() {
        ImportHandler.pop();
    }
    public linkPluginImports(pluginName: string) {
        const { projectName } = this.projectMeta;
        return ImportHandler.linkProjectPlugin(projectName, pluginName);
    }

    public resolveConfigFn<
        C extends TSConfigFn<any>
    >(cb: C) {
        const {
            projectRoot,
            projectName,
        } = this.projectMeta;
        return cb(
            {
                projectRoot,
                imports: ImportHandler.getProjectImports(projectName),
            },
            this.propBag,
        );
    }
}