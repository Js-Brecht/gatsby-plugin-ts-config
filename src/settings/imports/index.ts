import { PluginError } from "@util/output";
import { ImportHandler } from "./handler";
import type {
    ApiType,
    ImportsCache,
    RootPluginImports,
} from "@typeDefs/internal";

export type ImportHandlerFn = (filename: string) => void;

const importsCache: ImportsCache = {};

export const getProjectImports = (projectName: string): RootPluginImports => {
    return importsCache[projectName] || (
        importsCache[projectName] = {}
    );
};

export const linkProjectPlugin = (projectName: string, pluginName: string): void => {
    const rootProject = getProjectImports(projectName);
    const pluginProject = getProjectImports(pluginName);

    const pluginLinks = rootProject.plugins || (
        rootProject.plugins = {}
    );

    if (pluginLinks.hasOwnProperty(pluginName)) {
        throw new PluginError([
            `Attempting to link plugin ${pluginName} to project ${projectName} failed.`,
            `Plugin ${pluginName} has already been linked!`,
        ].join("\n"));
    }

    pluginLinks[pluginName] = pluginProject;
};

const importHandlerCache: Record<string, ImportHandlerFn> = {};

export type GetImportHandlerFn = typeof getImportHandler;

export const getImportHandler = (
    apiType: ApiType,
    projectName: string,
) => {
    const cacheKey = `${apiType}:${projectName}`;
    if (importHandlerCache[cacheKey]) {
        return importHandlerCache[cacheKey];
    }

    const projectImports = getProjectImports(projectName);
    const apiImports = projectImports[apiType] || (
        projectImports[apiType] = []
    );

    return importHandlerCache[cacheKey] = (filename: string) => {
        apiImports.push(filename);
    };
};

export const importHandler = new ImportHandler(getImportHandler);