// import { PluginError } from "@util/output";
import { popArray } from "@util/objects";
import type { Project } from "@lib/project";
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

const getProjectInfo = (project: Project) => ({
    apiType: project.apiType,
    projectName: project.projectName,
});

class ImportHandlerImpl {
    public getProjectImports(projectName: string): RootPluginImports {
        return importsCache[projectName] || (
            importsCache[projectName] = {}
        );
    }

    public linkProjectPlugin(projectName: string, pluginName: string): void {
        const rootProject = this.getProjectImports(projectName);
        const pluginProject = this.getProjectImports(pluginName);

        const pluginLinks = rootProject.plugins || (
            rootProject.plugins = {}
        );

        // if (pluginLinks.hasOwnProperty(pluginName)) {
        //     throw new PluginError([
        //         `Attempting to link plugin ${pluginName} to project ${projectName} failed.`,
        //         `Plugin ${pluginName} has already been linked!`,
        //     ].join("\n"));
        // }

        pluginLinks[pluginName] = pluginProject;
    }

    private pushPrev(handlerMeta: HandlerCacheMeta) {
        const key = getPrevKey(handlerMeta.type, handlerMeta.plugin);
        const prev = handlerCache.prevIndex[key] = (
            handlerCache.prevIndex[key] || []
        );
        prev.push(handlerMeta);
        handlerCache.previous.push(handlerMeta);
    }
    private getPrev(apiType: ApiType, pluginName: string) {
        const key = getPrevKey(apiType, pluginName);
        return handlerCache.prevIndex[key] || [];
    }
    private popPrev() {
        const last = handlerCache.previous.pop();
        if (!last) return;

        const { type, plugin } = last;
        const index = this.getPrev(type, plugin);
        popArray(index, last);

        return last;
    }

    public getCurrent(project: Project) {
        const { apiType, projectName } = getProjectInfo(project);
        const current = handlerCache.current;
        if (current) {
            if (current.type === apiType && current.plugin === projectName) {
                return current.handler;
            }
        }

        const prev = this.getPrev(apiType, projectName);
        return prev[prev.length - 1]?.handler;
    }


    private getImportHandler(project: Project) {
        const { apiType, projectName } = getProjectInfo(project);

        const cacheKey = `${apiType}:${projectName}`;
        if (importHandlers[cacheKey]) {
            return importHandlers[cacheKey];
        }

        const projectImports = this.getProjectImports(projectName);
        const apiImports = projectImports[apiType] || (
            projectImports[apiType] = []
        );

        return importHandlers[cacheKey] = (filename: string) => {
            apiImports.push(filename);
        };
    }
    public push(project: Project) {
        const { apiType, projectName } = getProjectInfo(project);
        const newHandler = this.getImportHandler(project);
        const current = handlerCache.current;

        if (current && current.handler !== newHandler) {
            this.pushPrev(current);
        }

        const myMeta: HandlerCacheMeta = {
            type: apiType,
            plugin: projectName,
            handler: newHandler,
        };

        handlerCache.current = myMeta;
        return () => {
            if (handlerCache.current === myMeta) {
                this.pop();
                return;
            }

            const index = this.getPrev(apiType, projectName);
            popArray(index, myMeta);
            popArray(handlerCache.previous, myMeta);
        };
    }

    public pop() {
        handlerCache.current = this.popPrev();
    }

    public addImport: ImportHandlerFn = (filename) => {
        if (!handlerCache.current) return;
        return handlerCache.current.handler(filename);
    }
}

export const ImportHandler = new ImportHandlerImpl();