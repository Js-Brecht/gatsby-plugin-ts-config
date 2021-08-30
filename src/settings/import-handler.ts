import { PluginError } from "@util/output";
import { popArray } from "@util/objects";
import type {
    ApiType,
    ImportsCache,
    RootPluginImports,
} from "@typeDefs";

export type ImportHandlerFn = (filename: string) => void;

type HandlerCacheMeta = {
    type: ApiType;
    plugin: string;
    handler: ImportHandlerFn;
}

type ImportHandlerCache = {
    prevIndex: Record<string, HandlerCacheMeta[]>
    previous: HandlerCacheMeta[];
    current?: HandlerCacheMeta;
}

const importHandlers: Record<string, ImportHandlerFn> = {};
const handlerCache: ImportHandlerCache = {
    prevIndex: {},
    previous: [],
};

const getPrevKey = (apiType: ApiType, pluginName: string) => (
    `${pluginName}:${apiType}`
);

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

    private static pushPrev(handlerMeta: HandlerCacheMeta) {
        const key = getPrevKey(handlerMeta.type, handlerMeta.plugin);
        const prev = handlerCache.prevIndex[key] = (
            handlerCache.prevIndex[key] || []
        );
        prev.push(handlerMeta);
        handlerCache.previous.push(handlerMeta);
    }
    private static getPrev(apiType: ApiType, pluginName: string) {
        const key = getPrevKey(apiType, pluginName);
        return handlerCache.prevIndex[key] || [];
    }
    private static popPrev() {
        const last = handlerCache.previous.pop();
        if (!last) return;

        const { type, plugin } = last;
        const index = ImportHandler.getPrev(type, plugin);
        popArray(index, last);

        return last;
    }

    public static getCurrent(apiType: ApiType, pluginName: string) {
        const current = handlerCache.current;
        if (current) {
            if (current.type === apiType && current.plugin === pluginName) {
                return current.handler;
            }
        }

        const prev = ImportHandler.getPrev(apiType, pluginName);
        return prev[prev.length - 1]?.handler;
    }

    public static push(apiType: ApiType, pluginName: string) {
        const newHandler = ImportHandler.getImportHandler(apiType, pluginName);
        const current = handlerCache.current;

        if (current && current.handler !== newHandler) {
            ImportHandler.pushPrev(current);
        }

        const myMeta: HandlerCacheMeta = {
            type: apiType,
            plugin: pluginName,
            handler: newHandler,
        };

        handlerCache.current = myMeta;
        return () => {
            if (handlerCache.current === myMeta) {
                ImportHandler.pop();
                return;
            }

            const index = ImportHandler.getPrev(apiType, pluginName);
            popArray(index, myMeta);
            popArray(handlerCache.previous, myMeta);
        };
    }

    public static pop() {
        handlerCache.current = ImportHandler.popPrev();
    }

    public static addImport: ImportHandlerFn = (filename) => {
        if (!handlerCache.current) return;
        return handlerCache.current.handler(filename);
    }
}