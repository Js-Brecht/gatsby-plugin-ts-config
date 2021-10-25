import path from "path";
import fs from "fs-extra";
import { GatsbyNode } from "gatsby";
import { Configuration } from "webpack";
import { GatsbyTsPluginOptions } from "./types";

type FileSystemCache = Extract<Configuration["cache"], { type: "filesystem" }>;

type GatsbyCreateWebpackConfig = NonNullable<GatsbyNode["onCreateWebpackConfig"]>;
type GatsbyCreateWebpackConfigParams = Parameters<GatsbyCreateWebpackConfig>;
type CreateWebpackConfig = (
    args: GatsbyCreateWebpackConfigParams[0],
    options: GatsbyCreateWebpackConfigParams[1] & GatsbyTsPluginOptions,
) => void;


const isFilesystemCache = (cacheConfig: Configuration["cache"]): cacheConfig is FileSystemCache => (
    !!cacheConfig
    && typeof cacheConfig !== "boolean"
    && cacheConfig.type === "filesystem"
)

export const onCreateWebpackConfig: CreateWebpackConfig = async (
    api,
    options
) => {
    const {
        actions: {
            replaceWebpackConfig,
        },
        getConfig,
    } = api;

    // if (!gatsbyNodePath || !(await fs.pathExists(gatsbyNodePath))) return;
    // if (!gatsbyNodePath.endsWith(".ts")) return;

    const config: Configuration = getConfig();
    const cacheConfig = config.cache;
    if (!isFilesystemCache(cacheConfig)) return;
    if (!cacheConfig.buildDependencies?.config) return;

    const configDependencies = cacheConfig.buildDependencies.config;
    if (configDependencies.length === 0) return;

    let hasChanges = false;
    const maxLength = configDependencies.length - 1;
    for (const i in configDependencies) {
        const idx = maxLength - Number(i);
        const curPath = configDependencies[idx];
        const extname = path.extname(curPath);
        const tsPath = path.join(
            path.dirname(curPath),
            path.basename(curPath, extname) + ".ts"
        );

        const [
            hasCurPath,
            hasTsPath,
        ] = await Promise.all([
            fs.pathExists(curPath),
            fs.pathExists(tsPath)
        ]);

        hasChanges = hasChanges || (!hasCurPath || hasTsPath);

        if (hasCurPath && hasTsPath) {
            configDependencies.splice(idx + 1, 0, tsPath);
        } else if (hasTsPath) {
            configDependencies[idx] = tsPath;
        } else if (!hasCurPath) {
            configDependencies.splice(idx, 0);
        }
    }

    if (hasChanges) {
        replaceWebpackConfig(config);
    }
}