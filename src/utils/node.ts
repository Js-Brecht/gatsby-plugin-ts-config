import {
    IConfigTypes,
    IGatsbyEndpoints,
    IEndpointReturnTypes,
    IEndpointReturnObject,
    InferredConfigType,
} from "../types";
import RequireRegistrar from './register';
import OptionsHandler from './options-handler';
import { throwError } from "./errors";

export const preferDefault = (compiled: any) => compiled && compiled.default || compiled;

export const tryRequireModule = <T extends IConfigTypes = IConfigTypes>(
    configType: T,
    endpoints?: IGatsbyEndpoints,
    startRegistrar = true,
): IEndpointReturnTypes<T> => {
    if (!endpoints || !endpoints[configType]) return {} as IEndpointReturnTypes<T>;
    const modulePath = endpoints[configType]![0];
    let readModule = {} as IEndpointReturnTypes<T>;
    try {
        if (startRegistrar) RequireRegistrar.start(configType);
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

export const getModuleObject: IGetModuleObject = <
    T extends IEndpointReturnTypes,
    K extends InferredConfigType<T> = InferredConfigType<T>,
>(mod: T): IEndpointReturnObject<K> => {
    if (mod instanceof Function) {
        return (mod as Function)(OptionsHandler.public());
    }
    return mod as unknown as IEndpointReturnObject<K>;

};