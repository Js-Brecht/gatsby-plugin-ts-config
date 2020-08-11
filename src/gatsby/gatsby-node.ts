import { GatsbyNode, CreateWebpackConfigArgs } from 'gatsby';
import {
    tryRequireModule,
    getModuleObject,
} from '../utils/node';
import { setupGatsbyEndpointProxies } from '../utils/endpoints';
import OptionsHandler from '../utils/options-handler';

const { endpoints, cacheDir } = OptionsHandler.get();

type IGatsbyNode = Required<GatsbyNode>;
const gatsbyNodeModule = tryRequireModule('node', endpoints, false);
const gatsbyNode = getModuleObject(gatsbyNodeModule);

type IGatsbyNodeFunctions = keyof IGatsbyNode;
type IGatsbyNodeFnParameters<T extends IGatsbyNodeFunctions> = Parameters<IGatsbyNode[T]>;
type IGatsbyNodeFnReturn<T extends IGatsbyNodeFunctions> = ReturnType<IGatsbyNode[T]>;
type IGatsbyNodeFn<T extends IGatsbyNodeFunctions> = (...args: IGatsbyNodeFnParameters<T>) => IGatsbyNodeFnReturn<T>;

const wrapGatsbyNode = <T extends IGatsbyNodeFunctions>(
    endpoint: T,
    cb: IGatsbyNodeFn<T>,
): IGatsbyNodeFn<T> => {
    return (...args) => {
        const callOriginal = () => {
            if (typeof gatsbyNode[endpoint] === 'function') {
                return (gatsbyNode[endpoint] as Function)(...args);
            }
        };
        const result = cb(...args);
        if (result instanceof Promise) {
            return result.then(() => {
                return callOriginal();
            }) as IGatsbyNodeFnReturn<T>;
        } else {
            return callOriginal();
        }
    };
};

export = {
    ...gatsbyNode,
    onCreateWebpackConfig: wrapGatsbyNode('onCreateWebpackConfig', ({
        actions: {
            setWebpackConfig,
        },
    }) => {
        setWebpackConfig({
            resolve: {
                alias: {
                    "gatsby-plugin-ts-config-cache": cacheDir,
                },
            },
        });
        return;
    }),

    onPreBootstrap: wrapGatsbyNode('onPreBootstrap', () => {
        setupGatsbyEndpointProxies({
            resolvedEndpoints: endpoints,
            distDir: __dirname,
            cacheDir,
        });
    }),
} as IGatsbyNode;