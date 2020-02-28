import { GatsbyConfig } from 'gatsby';
import { ITsConfigArgs } from './types';

type IGeneratedGatsbyConfig = Pick<GatsbyConfig, 'plugins'>;
interface IGenerateConfig {
    (args: ITsConfigArgs): IGeneratedGatsbyConfig;
}

const generateConfig: IGenerateConfig = ({
    projectRoot = process.cwd(),
    configDir = '',
    tsNode = {},
} = {}) => {
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

export {
    IGenerateConfig,
    ITsConfigArgs,
    IGeneratedGatsbyConfig,
    generateConfig,
};

export * from './types';