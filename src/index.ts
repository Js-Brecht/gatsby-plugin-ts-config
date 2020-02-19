import { GatsbyConfig } from 'gatsby';
import { ITsConfigArgs } from './gatsby/gatsby-config';
import { getAbsoluteRelativeTo } from './utils/tools';

type IGeneratedGatsbyConfig = Pick<GatsbyConfig, 'plugins'>;
interface IGenerateConfig {
    (args: ITsConfigArgs): IGeneratedGatsbyConfig;
}

const generateConfig: IGenerateConfig = ({
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

export {
    IGenerateConfig,
    ITsConfigArgs,
    IGeneratedGatsbyConfig,
    generateConfig,
}

export { default as namespace } from './utils/namespace';