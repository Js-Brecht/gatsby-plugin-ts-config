import * as path from 'path';
import { GatsbyNode, CreateWebpackConfigArgs, ParentSpanPluginArgs } from 'gatsby';
import { preferDefault } from '../utils/node';
import { setupGatsbyEndpoints } from '../utils/endpoints';
import OptionsHandler from '../utils/options-handler';
import RequireRegistrar from '../utils/register';

const { endpoints, cacheDir } = OptionsHandler.get();

type IGatsbyNode = Required<GatsbyNode>;
let gatsbyNode = {} as IGatsbyNode;
if (endpoints.node) {
    try {
        RequireRegistrar.start();
        const userGatsbyNode = preferDefault(require(endpoints.node));
        gatsbyNode = typeof userGatsbyNode === 'function' ? userGatsbyNode(OptionsHandler.public()) : userGatsbyNode;
    } catch (err) { // gatsby-node didn't exist, so move on without it.
        throw new Error(`[gatsby-plugin-ts-config] Unable to read your 'gatsby-node'!\n${err.stack}`);
    } finally {
        RequireRegistrar.stop();
    }
}


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
        plugins: {
            define,
        },
    }: CreateWebpackConfigArgs) => {
        setWebpackConfig({
            plugins: [
                define({
                    __TS_CONFIG_CACHE_DIR__: JSON.stringify(cacheDir + path.sep),
                }),
            ],
        });
        return;
    }),

    onPreBootstrap: wrapGatsbyNode('onPreBootstrap', () => {
        setupGatsbyEndpoints({
            resolvedEndpoints: endpoints,
            distDir: __dirname,
            cacheDir,
        });
    }),
} as IGatsbyNode;