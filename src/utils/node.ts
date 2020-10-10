import {
    createRequire as nodeCreateRequire,
    createRequireFromPath as nodeCreateRequireFromPath,
} from 'module';
import RequireRegistrar from './register';
import OptionsHandler from './options-handler';
import { throwError } from "./errors";

import type {
    GatsbyConfigTypes,
    GatsbyEndpoints,
    EndpointReturnTypes,
    EndpointReturnObject,
    InferredConfigType,
} from "../types";

export const preferDefault = (compiled: any) => compiled && compiled.default || compiled;

export const tryRequireModule = <T extends GatsbyConfigTypes = GatsbyConfigTypes>(
    configType: T,
    endpoints?: GatsbyEndpoints,
    startRegistrar = true,
    pluginName?: string,
): EndpointReturnTypes<T> => {
    if (!endpoints || !endpoints[configType]) return {} as EndpointReturnTypes<T>;
    const modulePath = endpoints[configType]![0];
    let readModule = {} as EndpointReturnTypes<T>;
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
        T extends EndpointReturnTypes,
        K extends InferredConfigType<T> = InferredConfigType<T>,
    >(mod: T): EndpointReturnObject<K>;
}

export const getModuleObject: IGetModuleObject = (mod) => {
    if (mod instanceof Function) {
        return (mod as Function)(OptionsHandler.public(), OptionsHandler.propertyBag);
    }
    return mod;

};

export const createRequire = nodeCreateRequire || nodeCreateRequireFromPath;