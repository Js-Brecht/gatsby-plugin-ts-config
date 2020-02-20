import { ITsConfigArgs, IGenerateConfig, IGeneratedGatsbyConfig } from './types';


const generateConfig: IGenerateConfig = ({
    projectRoot = process.cwd(),
    configDir = '',
}: ITsConfigArgs = {}) => {
    const config: IGeneratedGatsbyConfig = {
        plugins: [
            {
                resolve: `gatsby-plugin-ts-config`,
                options: {
                    projectRoot,
                    configDir,
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
}

export { default as namespace } from './utils/namespace';