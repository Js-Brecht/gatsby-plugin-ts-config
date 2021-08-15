import set from "lodash/set";
import get from "lodash/get";
import { ApiType } from "@typeDefs/internal";

interface IApiModuleOptions {
    resolveImmediate?: boolean;
}

type ApiModuleOptionCache = {
    [project: string]: {
        [api in ApiType]?: IApiModuleOptions;
    }
}

const optionsCache: ApiModuleOptionCache = {};

export const setApiOption = (project: string, api: ApiType, opts: IApiModuleOptions) => {
    set(optionsCache, [project, api], opts);
};

export const getApiOption = (project: string, api: ApiType): IApiModuleOptions => (
    get(optionsCache, [project, api], {})
);