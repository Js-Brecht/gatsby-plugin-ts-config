import { Project } from "@lib/project";
import { Serializer } from "@lib/serializer";
import { Module } from "@util/node";

import type {
    TranspilerArgs,
    TranspileType,
} from "@typeDefs";

export type GenericArgs = TranspilerArgs<TranspileType>;

type CachedTranspilerSettings = {
    project: Project;
    args: GenericArgs;
    extensions?: NodeJS.RequireExtensions
}

const settingsCache = new Map<string, CachedTranspilerSettings>();
const previousSettings = [] as string[];
let currentSettings: CachedTranspilerSettings;

const getCacheKey = (optKey: string, project: Project) => [
    optKey,
    project.options.hooks,
].map(Serializer.serialize).filter(Boolean).join(":");

export class TranspilerSettings {
    public static get project() {
        return currentSettings.project;
    }
    public static get importHandler() {
        return currentSettings.project.importHandler;
    }
    public static get ignoreHooks() {
        return currentSettings.project.options.hooks?.ignore;
    }
    public static get current() {
        return currentSettings;
    }

    public static push(
        optKey: string,
        args: GenericArgs,
        project: Project,
    ) {
        const cacheKey = getCacheKey(optKey, project);
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

    public static pop() {
        let prevLen = previousSettings.length - 1;

        // No previously cached settings???
        if (prevLen === -1) return -1;
        // Already on the base
        if (prevLen === 0) return false;

        previousSettings.pop();
        prevLen--;
        const prevKey = previousSettings[prevLen];

        if (!settingsCache.has(prevKey)) return false;
        return settingsCache.get(prevKey)!;
    }

    public static saveExtensions() {
        currentSettings.extensions = { ...Module._extensions };
    }
}