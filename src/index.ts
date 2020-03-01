import { GatsbyConfig } from 'gatsby';
import { ITSConfigArgs } from './types';

type IGeneratedGatsbyConfig = Pick<GatsbyConfig, 'plugins'>;
interface IGenerateConfig {
    (args: ITSConfigArgs): IGeneratedGatsbyConfig;
}

const generateConfig: IGenerateConfig = (options) => {
    const config: IGeneratedGatsbyConfig = {
        plugins: [
            {
                resolve: `gatsby-plugin-ts-config`,
                options,
            },
        ],
    };
    return config;
};

export {
    generateConfig,
};

export * from './types';