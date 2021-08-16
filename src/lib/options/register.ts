import path from "path";

import { merge } from "@util/obj";

import type { TransformOptions as BabelOptions } from "@babel/core";
import type { RegisterOptions as TSNodeOptions } from "ts-node";
import type {
    TranspileType,
    TranspilerOptions,
} from "@typeDefs/internal";


const optionsRegister: Record<string, {
    "babel"?: BabelOptions;
    "ts-node"?: TSNodeOptions;
}> = {};

const mergeOptions = <R>(
    project: string,
    type: TranspileType,
    defaultOptions: R,
    extendOptions?: R,
): R => {
    let hasOptions = true;
    if (!(project in optionsRegister)) {
        hasOptions = false;
        optionsRegister[project] = {};
    }

    return optionsRegister[project][type] = merge(
        hasOptions ? {} : defaultOptions,
        optionsRegister[project][type] || {},
        extendOptions || {},
    ) as R;
};

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
                presets: [
                    // require.resolve("@babel/preset-typescript"),
                    require.resolve("./babel/preset"),
                ],
            } as BabelOptions;
        }
        case "ts-node": {
            return {
                project: path.join(projectRoot, "tsconfig.json"),
                files: true,
                compilerOptions: {
                    module: "commonjs",
                    target: "es2015",
                    allowJs: true,
                    noEmit: true,
                    declaration: false,
                    importHelpers: true,
                    resolveJsonModule: true,
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
    const options = mergeOptions<TranspilerOptions<T>>(
        projectRoot,
        type,
        defaultOptions,
        addOptions,
    );

    return options;
};