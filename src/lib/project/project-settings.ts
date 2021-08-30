import { keys } from "ts-transformer-keys";
import get from "lodash/get";
import set from "lodash/set";
import pick from "lodash/pick";
import isEqual from "lodash/isEqual";

import { merge } from "@util/objects";
import { getProject, ProjectMeta } from "@util/project-meta";
import { getPropBag } from "@settings/prop-bag";

import type {
    TsConfigPluginOptions,
    PluginOptionDiff,
    PropertyBag,
    ApiType,
} from "@typeDefs";

export type ProjectOptions = Omit<TsConfigPluginOptions, "props">;

export interface IInitSettings {
    projectMeta: ProjectMeta;
    options?: ProjectOptions;
    propBag?: PropertyBag;
}

export interface IBaseProjectSettings extends Required<IInitSettings> {}

type ProjectSettingsCache = {
    [projectRoot: string]: {
        [apiType in ApiType]?: ProjectSettings;
    }
}

const projectSettingsCache: ProjectSettingsCache = {};

const setCachedSettings = (
    apiType: ApiType,
    projectRoot: string,
    projectSettings: ProjectSettings,
) => (
    set(projectSettingsCache, [projectRoot, apiType], projectSettings),
    projectSettings
);
const getCachedSettings = (
    apiTypes: ApiType[],
    projectRoot: string,
) => {
    for (const api of apiTypes) {
        const val = get(projectSettingsCache, [projectRoot, api]);
        if (val) return val;
    }
};

const optionDiffKeys = keys<PluginOptionDiff>();

export class ProjectSettings {
    public static getInstance(
        apiType: ApiType,
        newSettings: Partial<IInitSettings>,
        setCache: boolean,
    ) {
        const projectMeta = newSettings.projectMeta || getProject();
        const { projectRoot } = projectMeta;

        const existing = getCachedSettings(
            [
                apiType,
                apiType === "config" ? "node" : "config",
            ],
            projectRoot,
        );

        if (existing) {
            const configOptions = pick(newSettings.options, optionDiffKeys);
            const options = pick(existing.options, optionDiffKeys);

            /**
             * The settings haven't changed.
             * Don't need a separate ProjectSettings instance
             */
            if (isEqual(configOptions, options)) {
                return {
                    changed: false,
                    settings: existing.merge(newSettings),
                };
            }
        }

        const settings = new ProjectSettings({
            ...newSettings,
            projectMeta,
        });

        if (setCache) {
            setCachedSettings(
                apiType,
                projectRoot,
                settings,
            );
        }

        return {
            changed: true,
            settings,
        };
    }

    public readonly options: ProjectOptions;
    public readonly projectMeta: ProjectMeta;

    private _propBag!: PropertyBag;

    private constructor(input: IInitSettings) {
        if (!input.options) input.options = {};
        if (!input.projectMeta) input.projectMeta = getProject();

        this.projectMeta = input.projectMeta;
        this.options = input.options;

        this.merge(input);
    }

    public get propBag() { return this._propBag; }

    protected merge(input = {} as Partial<IInitSettings>) {
        const inputProps = input.propBag || (
            (input.options as TsConfigPluginOptions)?.props
        );

        this._propBag = getPropBag(this.projectMeta.projectRoot, inputProps);
        return this;
    }
}