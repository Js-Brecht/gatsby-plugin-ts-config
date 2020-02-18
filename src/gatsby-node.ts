import * as path from 'path';
import { DefinePlugin } from 'webpack';
import { GatsbyNode } from 'gatsby';
import namespace from './namespace';

// @ts-ignore
const { configDir, projectRoot } = global[namespace];

let gatsbyNode: GatsbyNode = {};
try {
    gatsbyNode = require(path.join(configDir, 'gatsby-node'))(projectRoot);
} catch (err) { // gatsby-node didn't exist, so move on without it.
    // noop
}

const onCreateWebpackConfig: GatsbyNode['onCreateWebpackConfig'] = (args, options) => {
    const { setWebpackConfig } = args.actions;
    setWebpackConfig({
        plugins: [
            new DefinePlugin({
                __TS_CONFIG_DIR: JSON.stringify(configDir),
                __TS_CONFIG_PROJECT_DIR: JSON.stringify(projectRoot),
            }),
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