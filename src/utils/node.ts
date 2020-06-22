import {
    createRequire as nodeCreateRequire,
    createRequireFromPath as nodeCreateRequireFromPath,
} from 'module';
import RequireRegistrar from './register';
import OptionsHandler from './options-handler';
import { throwError } from "./errors";

import type {
    IGatsbyConfigTypes,
    IGatsbyEndpoints,
    IEndpointReturnTypes,
    IEndpointReturnObject,
    InferredConfigType,
} from "../types";

export const preferDefault = (compiled: any) => compiled && compiled.default || compiled;

export const tryRequireModule = <T extends IGatsbyConfigTypes = IGatsbyConfigTypes>(
    configType: T,
    endpoints?: IGatsbyEndpoints,
    startRegistrar = true,
    pluginName?: string,
): IEndpointReturnTypes<T> => {
    if (!endpoints || !endpoints[configType]) return {} as IEndpointReturnTypes<T>;
    const modulePath = endpoints[configType]![0];
    let readModule = {} as IEndpointReturnTypes<T>;
    try {
        if (startRegistrar) RequireRegistrar.start(configType, pluginName);
        readModule = preferDefault(require(modulePath));
    } catch (err) {
        throwError(`[gatsby-plugin-ts-config] An error occurred while reading your gatsby-${configType}!`, err);
    } finally {
        if (startRegistrar) RequireRegistrar.stop();
    }
    return readModule;
};

interface IGetModuleObject {
    <
        T extends IEndpointReturnTypes,
        K extends InferredConfigType<T> = InferredConfigType<T>,
    >(mod: T): IEndpointReturnObject<K>;
}

export const getModuleObject: IGetModuleObject = (mod) => {
    if (mod instanceof Function) {
        return (mod as Function)(OptionsHandler.public());
    }
    return mod;

};

export const createRequire = nodeCreateRequire || nodeCreateRequireFromPath;