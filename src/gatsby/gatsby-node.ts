import * as path from 'path';
import { DefinePlugin } from 'webpack';
import { GatsbyNode } from 'gatsby';
import { IGlobalOpts } from '../types';
import OptionsHandler from '../utils/options-handler';

const { endpoints, projectRoot }: IGlobalOpts = OptionsHandler.get();

let gatsbyNode: GatsbyNode = {};
if (endpoints.node) {
    try {
        const userGatsbyNode = require(path.join(configDir, 'gatsby-node'));
        gatsbyNode = typeof userGatsbyNode === 'function' ? userGatsbyNode(projectRoot) : userGatsbyNode;
    } catch (err) { // gatsby-node didn't exist, so move on without it.
        // noop
    }
}

export = gatsbyNode;