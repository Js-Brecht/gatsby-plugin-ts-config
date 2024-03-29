import path from "path";

import { merge } from "@util/objects";

import type { TransformOptions as BabelOptions } from "@babel/core";
import type { RegisterOptions as TSNodeOptions } from "ts-node";
import type {
    TranspileType,
    TranspilerOptions,
} from "@typeDefs/internal";

const getDefaultOptions = (
    type: TranspileType,
    projectRoot: string,
): BabelOptions | TSNodeOptions => {
    switch (type) {
        case "babel": {
            return {
                sourceMaps: "inline",
                sourceRoot: projectRoot,
                cwd: projectRoot,
                babelrc: false,
                presets: [
                    // require.resolve("@babel/preset-typescript"),
                    require.resolve("./babel/preset"),
                ],
            } as BabelOptions;
        }
        case "ts-node": {
            return {
                // project: path.join(projectRoot, "tsconfig.json"),
                skipProject: true,
                files: true,
                compilerOptions: {
                    module: "commonjs",
                    target: "es2015",
                    allowJs: true,
                    noEmit: true,
                    declaration: false,
                    importHelpers: true,
                    resolveJsonModule: true,
                    esModuleInterop: true,
                    jsx: "preserve",
                    // sourceMap: true,
                },
            } as TSNodeOptions;
        }
    }
};

export const getRegisterOptions = <
    T extends TranspileType,
>(
    projectRoot: string,
    type: T,
    addOptions?: TranspilerOptions<T>,
): TranspilerOptions<T> => {
    const defaultOptions = (
        getDefaultOptions(type, projectRoot) as TranspilerOptions<T>
    );
    return merge(
        {},
        defaultOptions,
        addOptions,
    );
};