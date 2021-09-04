import { Project } from "@lib/project";
import { Serializer } from "@lib/serializer";
import { Module } from "@util/node";
import { ImportHandler } from "./import-handler";

import type {
    TranspilerArgs,
    TranspileType,
} from "@typeDefs";

export type GenericArgs = TranspilerArgs<TranspileType>;

type CachedTranspilerSettings = {
    project: Project;
    args: GenericArgs;
    extensions?: NodeJS.RequireExtensions;
}

const settingsCache = new Map<string, CachedTranspilerSettings>();
const previousSettings = [] as string[];
let currentSettings: CachedTranspilerSettings;

const getCacheKey = (optKey: string, project: Project) => [
    optKey,
    project.options.hooks,
].map(Serializer.serialize).filter(Boolean).join(":");

class TranspilerSettingsImpl {
    private project!: Project;

    public get importHandler() {
        return ImportHandler.getCurrent(this.project);
    }
    public get ignoreHooks() {
        return this.project.options.hooks?.ignore;
    }

    public push(
        optKey: string,
        args: GenericArgs,
        project: Project,
    ) {
        const cacheKey = getCacheKey(optKey, project);
        this.project = project;

        if (settingsCache.has(cacheKey)) {
            const prevLen = previousSettings.length - 1;
            const latestKey = previousSettings[prevLen];
            if (latestKey === cacheKey) return false;
            currentSettings = settingsCache.get(cacheKey)!;
        } else {
            currentSettings = {
                project,
                args,
            };
            settingsCache.set(
                cacheKey,
                currentSettings,
            );
        }

        previousSettings.push(cacheKey);
        return currentSettings;
    }

    public pop() {
        let prevLen = previousSettings.length - 1;

        // No previously cached settings???
        if (prevLen === -1) return -1;
        // Already on the base
        if (prevLen === 0) return false;

        previousSettings.pop();
        prevLen--;
        const prevKey = previousSettings[prevLen];

        const restoreSettings = settingsCache.get(prevKey);
        if (!restoreSettings) return false;

        this.project = restoreSettings.project;
        return restoreSettings;
    }

    public saveExtensions() {
        if (currentSettings) {
            currentSettings.extensions = { ...Module._extensions };
        }
    }
}

export const TranspilerSettings = new TranspilerSettingsImpl();