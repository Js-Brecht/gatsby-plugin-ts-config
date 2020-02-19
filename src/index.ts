import { GatsbyConfig } from 'gatsby';
import { ITsConfigArgs } from './gatsby/gatsby-config';
import { getAbsoluteRelativeTo } from './utils/tools';

type IGeneratedGatsbyConfig = Pick<GatsbyConfig, 'plugins'>;
export interface IGenerateConfig {
    (args: ITsConfigArgs): IGeneratedGatsbyConfig;
}

export const generateConfig: IGenerateConfig = ({
    projectRoot = process.cwd(),
    configDir = '',
    tsNode = {},
}) => {
    projectRoot = getAbsoluteRelativeTo(projectRoot);
    configDir = getAbsoluteRelativeTo(projectRoot, configDir);
    const config: IGeneratedGatsbyConfig = {
        plugins: [
            {
                resolve: `gatsby-plugin-ts-config`,
                options: {
                    projectRoot,
                    configDir,
                    tsNode,
                },
            },
        ],
    };
    return config;
};