import * as path from 'path';
import { DefinePlugin } from 'webpack';
import { GatsbyNode } from 'gatsby';
import { IGlobalOpts } from '../types';
import { preferDefault } from '../utils/node';
import OptionsHandler from '../utils/options-handler';

const { endpoints, projectRoot }: IGlobalOpts = OptionsHandler.get();

let gatsbyNode: GatsbyNode = {};
if (endpoints.node) {
    try {
        const userGatsbyNode = preferDefault(require(endpoints.node));
        gatsbyNode = typeof userGatsbyNode === 'function' ? userGatsbyNode(projectRoot) : userGatsbyNode;
    } catch (err) { // gatsby-node didn't exist, so move on without it.
        throw new Error(`[gatsby-plugin-ts-config] Unable to read your 'gatsby-node'!\n${err.stack}`);
    }
}

export = gatsbyNode;