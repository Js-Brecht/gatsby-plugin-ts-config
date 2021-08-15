import { keys } from "ts-transformer-keys";

import { isGatsbyConfig } from "@util/type-util";
import { preferDefault } from "@util/node";
import { resolveFilePath } from "@util/fs-tools";

import { getPropBag } from "./options/prop-bag";
import { getApiOption, setApiOption } from "./options/api";
import { getProjectImports, linkProjectPlugin } from "./options/imports";
import { resolveLocalPlugin } from "./local-plugins";

import type {
    ApiType,
    InitValue,
    PluginModule,
    PropertyBag,
} from "@typeDefs/internal";
import type {
    TSConfigFn,
} from "@typeDefs/public";
import type { Transpiler } from "./transpiler";

type GetApiType<T extends TSConfigFn<any>> = (
    T extends TSConfigFn<infer TApiType>
        ? TApiType
        : never
)

const apiTypeKeys = keys<Record<ApiType, any>>();

interface IProcessApiModuleOptions<T extends ApiType> {
    apiType: T;
    init: InitValue;
    projectName: string;
    projectRoot: string;
    propBag?: PropertyBag;
    transpiler: Transpiler;
}

export const processApiModule = <
    T extends ApiType
>({
    apiType,
    init,
    projectName,
    projectRoot,
    propBag: initPropBag = {},
    transpiler,
}: IProcessApiModuleOptions<T>) => {
    const apiOptions = getApiOption(projectRoot, apiType);
    const { resolveImmediate = true } = apiOptions;

    const propBag = getPropBag(apiType, projectRoot, initPropBag);

    const resolveModuleFn = <
        C extends TSConfigFn<any>
    >(cb: C): PluginModule<GetApiType<C>> => (
        cb(
            {
                projectRoot,
                imports: getProjectImports(projectName),
            },
            propBag,
        ) as PluginModule<GetApiType<C>>
    );

    let apiModule = preferDefault(
        transpiler<T>(
            apiType,
            init,
            projectName,
            projectRoot,
        ),
    );

    let gatsbyNode: TSConfigFn<"node"> | undefined = undefined;

    if (apiType === "config") {
        const gatsbyNodePath = resolveFilePath(projectRoot, "./gatsby-node");

        /**
         * We want to pre-process `gatsby-node` from `gatsby-config` because:
         *
         * 1. We want to get all of the chained imports from `gatsby-node`; and,
         * 2. We want to transpile it in case it is a `.ts` file, so that Gatsby
         *    can consume it.
         */
        if (gatsbyNodePath) {
            setApiOption(projectRoot, "node", { resolveImmediate: false });
            gatsbyNode = processApiModule({
                apiType: "node",
                init: gatsbyNodePath,
                projectName,
                projectRoot,
                propBag,
                transpiler,
            }) as TSConfigFn<"node">;
            setApiOption(projectRoot, "node", {});
        }
    }


    if (typeof apiModule === "function" && resolveImmediate) {
        apiModule = resolveModuleFn(apiModule);
    }

    if (typeof gatsbyNode === "function") {
        resolveModuleFn(gatsbyNode);
    }

    /**
     * Time to transpile/process local plugins
     */
    if (isGatsbyConfig(apiType, apiModule)) {
        apiModule?.plugins?.forEach((plugin) => {
            const localPluginName = typeof plugin === "string"
                ? plugin
                : plugin.resolve;
            if (!localPluginName) return;

            const pluginPath = resolveLocalPlugin({
                projectRoot,
                pluginName: localPluginName,
            });
            if (!pluginPath) return; // This isn't a "local" plugin

            linkProjectPlugin(projectName, localPluginName);

            apiTypeKeys.forEach((type) => {
                const gatsbyModuleName = `./gatsby-${type}`;
                const apiPath = resolveFilePath(pluginPath, gatsbyModuleName);
                if (!apiPath) return; // This `gatsby-*` file doesn't exist for this local plugin

                processApiModule({
                    apiType: type,
                    init: apiPath,
                    projectRoot: pluginPath,
                    projectName: pluginPath,
                    propBag,
                    transpiler,
                });
            });
        });
    }

    return apiModule as PluginModule<T>;
};