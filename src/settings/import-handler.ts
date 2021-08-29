import { PluginError } from "@util/output";
import type {
    ApiType,
    ImportsCache,
    RootPluginImports,
} from "@typeDefs";

export type ImportHandlerFn = (filename: string) => void;

type HandlerCacheMeta = {
    plugin: string;
    handler: ImportHandlerFn;
}
type ImportHandlerCache = {
    previous: HandlerCacheMeta[];
    current?: HandlerCacheMeta;
}

const importHandlers: Record<string, ImportHandlerFn> = {};
const handlerCache: ImportHandlerCache = {
    previous: [],
};

const importsCache: ImportsCache = {};

export class ImportHandler {
    public static getProjectImports(projectName: string): RootPluginImports {
        return importsCache[projectName] || (
            importsCache[projectName] = {}
        );
    }

    public static getImportHandler(
        apiType: ApiType,
        projectName: string,
    ) {
        const cacheKey = `${apiType}:${projectName}`;
        if (importHandlers[cacheKey]) {
            return importHandlers[cacheKey];
        }

        const projectImports = ImportHandler.getProjectImports(projectName);
        const apiImports = projectImports[apiType] || (
            projectImports[apiType] = []
        );

        return importHandlers[cacheKey] = (filename: string) => {
            apiImports.push(filename);
        };
    }

    public static linkProjectPlugin(projectName: string, pluginName: string): void {
        const rootProject = ImportHandler.getProjectImports(projectName);
        const pluginProject = ImportHandler.getProjectImports(pluginName);

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
    }

    public static getCurrent(pluginName: string) {
        if (handlerCache.current && handlerCache.current.plugin === pluginName) {
            return handlerCache.current.handler;
        }
        return;
    }

    public static push(apiType: ApiType, pluginName: string) {
        const newHandler = ImportHandler.getImportHandler(apiType, pluginName);

        if (handlerCache.current && handlerCache.current.handler !== newHandler) {
            handlerCache.previous.push(handlerCache.current);
        }

        handlerCache.current = {
            plugin: pluginName,
            handler: newHandler,
        };
        return newHandler;
    }

    public static pop() {
        handlerCache.current = handlerCache.previous.pop();
    }

    public static addImport: ImportHandlerFn = (filename) => {
        if (!handlerCache.current) return;
        return handlerCache.current.handler(filename);
    }
}