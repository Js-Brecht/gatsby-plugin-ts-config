import { ITSConfigArgs, IGatsbyConfig } from './types';

type IGeneratedGatsbyConfig = Pick<IGatsbyConfig, 'plugins'>;
interface IGenerateConfig {
    (args: ITSConfigArgs): IGeneratedGatsbyConfig;
}

const generateConfig: IGenerateConfig = (options) => {
    return {
        plugins: [
            {
                resolve: `gatsby-plugin-ts-config`,
                options,
            },
        ],
    };
};

export {
    generateConfig,
};

export * from './types/public';