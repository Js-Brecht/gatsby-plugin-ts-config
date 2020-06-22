import OptionsHandler from './utils/options-handler';

import type { GatsbyConfig } from 'gatsby';
import type { ITSConfigArgs } from './types';

type IGeneratedGatsbyConfig = Pick<GatsbyConfig, 'plugins'>;
interface IGenerateConfig {
    (args: ITSConfigArgs): IGeneratedGatsbyConfig;
}

export const generateConfig: IGenerateConfig = (options) => {
    return {
        plugins: [
            {
                resolve: `gatsby-plugin-ts-config`,
                options: (options as Record<string, any>),
            },
        ],
    };
};

export const includePlugins = OptionsHandler.includePlugins;

export * from './types/public';