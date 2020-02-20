import { DefinePlugin } from 'webpack';
import { GatsbyNode } from 'gatsby';
import OptionsHandler from '../utils/options-handler';
import { IGlobalOpts } from '../types';

// @ts-ignore
const { endpoints, projectRoot }: IGlobalOpts = OptionsHandler.get();

let gatsbyNode: GatsbyNode = {};
if (endpoints.node) {
    try {
        const userGatsbyNode = require(endpoints.node);
        gatsbyNode = typeof userGatsbyNode === 'function' ? userGatsbyNode(projectRoot) : userGatsbyNode;
    } catch (err) { // gatsby-node didn't exist, so move on without it.
        // noop
    }
}

const onCreateWebpackConfig: GatsbyNode['onCreateWebpackConfig'] = (args, options) => {
    const { setWebpackConfig } = args.actions;

    const definePaths = {
        __TS_CONFIG_SSR: JSON.stringify(endpoints.ssr || ''),
        __TS_CONFIG_BROWSER: JSON.stringify(endpoints.browser || ''),
    };

    setWebpackConfig({
        plugins: [
            new DefinePlugin(definePaths),
        ],
    });
    if (gatsbyNode.onCreateWebpackConfig) {
        gatsbyNode.onCreateWebpackConfig(args, options);
    }
};

export = {
    ...gatsbyNode,
    onCreateWebpackConfig,
};