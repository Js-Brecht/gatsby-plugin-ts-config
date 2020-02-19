import * as path from 'path';
import { GatsbyConfig } from 'gatsby';
import { ITsConfigArgs } from './gatsby-config';

type IGeneratedGatsbyConfig = Pick<GatsbyConfig, 'plugins'>;
export interface IGenerateConfig {
    (args: ITsConfigArgs): IGeneratedGatsbyConfig;
}

export const generateConfig: IGenerateConfig = ({
    projectRoot = process.cwd(),
    configDir = '',
    tsNode = {},
}) => {
    const config: IGeneratedGatsbyConfig = {
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