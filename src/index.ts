import OptionsHandler from './utils/options-handler';

import type { GatsbyConfig } from 'gatsby';
import type { TSConfigSetupOptions, PropertyBag } from './types';

type GeneratedGatsbyConfig = Pick<GatsbyConfig, 'plugins'>;
interface IGenerateConfig {
    (args: TSConfigSetupOptions, props: PropertyBag): GeneratedGatsbyConfig;
}

export const generateConfig: IGenerateConfig = (options, props) => {
    return {
        plugins: [
            {
                resolve: `gatsby-plugin-ts-config`,
                options: {
                    ...(options as Record<string, any>),
                    props,
                },
            },
        ],
    };
};

export const includePlugins = OptionsHandler.includePlugins;

export * from './types/public';