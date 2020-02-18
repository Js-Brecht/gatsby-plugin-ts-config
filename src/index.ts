import * as path from 'path';
import { GatsbyConfig } from 'gatsby';
import { ITsConfigArgs } from './gatsby-config';

export type IGenerateConfig = (args: ITsConfigArgs) => Pick<GatsbyConfig, 'plugins'>;

export const generateConfig: IGenerateConfig = ({
    projectRoot = process.cwd(),
    configDir = '',
    tsNode = {},
}): GatsbyConfig => {
    const config = {
        plugins: [
            {
                resolve: `gatsby-plugin-ts-config`,
                options: {
                    projectRoot,
                    configDir: path.isAbsolute(configDir) ? configDir : path.resolve(path.relative(projectRoot, configDir)),
                    tsNode,
                },
            },
        ],
    };
    return config;
};