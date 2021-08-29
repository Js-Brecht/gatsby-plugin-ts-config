import type {
    ImportHandlerFn,
    GetImportHandlerFn
} from "./index";

import { ApiType } from "@typeDefs"

type ImportHandlerCache = {
    previous: ImportHandlerFn[];
    current?: ImportHandlerFn;
}

export class ImportHandler {
    private static handlerCache: ImportHandlerCache = {
        previous: [],
    }

    private get cache() {
        return ImportHandler.handlerCache;
    }

    private getImportHandler: GetImportHandlerFn;

    constructor(getImportHandler: GetImportHandlerFn) {
        this.getImportHandler = getImportHandler;
    }

    public set(apiType: ApiType, pluginName: string) {
        if (this.cache.current) {
            this.cache.previous.push(this.cache.current);
        }

        this.cache.current = this.getImportHandler(apiType, pluginName);
    }

    public pop() {
        this.cache.current = this.cache.previous.pop()
    }

    public addImport: ImportHandlerFn = (filename) => {
        if (!this.cache.current) return;
        return this.cache.current(filename);
    }
}