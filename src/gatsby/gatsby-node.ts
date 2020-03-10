import { GatsbyNode, CreateWebpackConfigArgs } from 'gatsby';
import { preferDefault } from '../utils/node';
import { setupGatsbyEndpoints } from '../utils/endpoints';
import OptionsHandler from '../utils/options-handler';
import RequireRegistrar from '../utils/register';
import { throwError } from '../utils/errors';

const { endpoints, cacheDir } = OptionsHandler.get();

type IGatsbyNode = Required<GatsbyNode>;
let gatsbyNode = {} as IGatsbyNode;
if (endpoints.node) {
    try {
        RequireRegistrar.start('node');
        const userGatsbyNode = preferDefault(require(endpoints.node[0]));
        gatsbyNode = typeof userGatsbyNode === 'function' ? userGatsbyNode(OptionsHandler.public()) : userGatsbyNode;
    } catch (err) {
        throwError(`[gatsby-plugin-ts-config] An error occurred while reading your gatsby-node!`, err);
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
    }: CreateWebpackConfigArgs) => {
        setWebpackConfig({
            resolve: {
                alias: {
                    "ts-config-cache-dir": cacheDir,
                },
            },
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