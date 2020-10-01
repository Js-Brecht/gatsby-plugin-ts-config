import { GatsbyNode as RootGatsbyNode } from 'gatsby';
import {
    tryRequireModule,
    getModuleObject,
} from '../utils/node';
import { setupGatsbyEndpointProxies } from '../utils/endpoints';
import OptionsHandler from '../utils/options-handler';

const { endpoints, cacheDir } = OptionsHandler.get();

type GatsbyNode = Required<RootGatsbyNode>;
const gatsbyNodeModule = tryRequireModule('node', endpoints, false);
const gatsbyNode = getModuleObject(gatsbyNodeModule);

type GatsbyNodeFunctions = keyof GatsbyNode;
type GatsbyNodeFnParameters<T extends GatsbyNodeFunctions> = Parameters<GatsbyNode[T]>;
type GatsbyNodeFnReturn<T extends GatsbyNodeFunctions> = ReturnType<GatsbyNode[T]>;
type GatsbyNodeFn<T extends GatsbyNodeFunctions> = (...args: GatsbyNodeFnParameters<T>) => GatsbyNodeFnReturn<T>;

const isFunction = (fn: any): fn is Function => (
    typeof fn === "function"
);

const wrapGatsbyNode = <T extends GatsbyNodeFunctions>(
    endpoint: T,
    cb: GatsbyNodeFn<T>,
): GatsbyNodeFn<T> => {
    return (...args) => {
        const callOriginal = () => {
            const ep = gatsbyNode[endpoint];
            if (isFunction(ep)) {
                return (ep as Function)(...args);
            }
        };
        const result = cb(...args);
        if (result instanceof Promise) {
            return result.then(() => {
                return callOriginal();
            }) as GatsbyNodeFnReturn<T>;
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
} as GatsbyNode;