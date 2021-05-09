import path from "path";
import { PluginError } from "@util/output";
import {
    getCallSite,
    getProjectPkgJson,
} from "@util/project";
import { getRegisterOptions } from "@lib/options";
import { getTranspiler } from "@lib/transpiler";
import { processApiModule } from "@lib/api-module";

import type {
    InitValue,
    ApiType,
    TsConfigPluginOptions,
    NoFirstParameter,
} from "@/types/internal";

export * from "./types/public";

export type UsePluginModule = NoFirstParameter<typeof useGatsbyPluginModule>;

export const useGatsbyPluginModule = (
    apiType: ApiType,
    init: InitValue,
    options = {} as TsConfigPluginOptions,
) => {
    const callSite = getCallSite();
    const callFile = callSite?.getFileName();
    if (!callFile) {
        throw new PluginError("Unable to determine call site");
    }

    const callDir = path.dirname(callFile);
    const [projectRoot, pkgJson] = getProjectPkgJson(callDir) || [];
    if (!pkgJson || !projectRoot) {
        throw new PluginError("Unable to locate project root");
    }

    const projectName = pkgJson.name;
    if (!projectName) {
        throw new PluginError("Unable to determine caller's project name");
    }

    const transpileType = options.type || "babel";

    const transpilerOpts = getRegisterOptions(
        callDir,
        transpileType,
        options.options,
    );

    const transpiler = getTranspiler(transpileType, {
        transpilerOpts,
    });


    try {
        return processApiModule({
            apiType,
            init,
            transpiler,

            projectRoot,
            projectName,
            propBag: options.props,
        });
    } catch (err) {
        throw new PluginError(err);
    }
};


export const useGatsbyConfig: UsePluginModule = (...args) => (
    useGatsbyPluginModule("config", ...args)
);

export const useGatsbyNode: UsePluginModule = (...args) => (
    useGatsbyPluginModule("node", ...args)
);