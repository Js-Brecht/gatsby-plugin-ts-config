import { PluginError } from "@util/output";
import type {
    ApiType,
    ImportsCache,
    RootPluginImports,
} from "@typeDefs/internal";

const importsCache: ImportsCache = {};

export const getProjectImports = (projectName: string): RootPluginImports => {
    return projectName in importsCache
        ? importsCache[projectName]
        : (
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

export const getImportHandler = (
    apiType: ApiType,
    projectName: string,
) => {
    const projectImports = getProjectImports(projectName);
    const apiImports = projectImports[apiType] || (
        projectImports[apiType] = []
    );

    return (filename: string) => {
        apiImports.push(filename);
    };
};