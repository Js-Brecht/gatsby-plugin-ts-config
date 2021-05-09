import path from "path";
import merge from "lodash.mergewith";

import type { TransformOptions as BabelOptions } from "@babel/core";
import type { RegisterOptions as TSNodeOptions } from "ts-node";
import type {
    ApiType,
    TranspileType,
    TranspilerOptions,
    PropertyBag,
} from "@typeDefs/internal";

type ApiPropertyBags = {
    [K in ApiType]: PropertyBag;
}
const propBags: Record<string, ApiPropertyBags> = {};

export const getPropBag = (
    apiType: ApiType,
    projectRoot: string,
    extendBag = {} as PropertyBag,
): PropertyBag => {
    const getProjectBag = () => {
        if (!propBags[projectRoot]) {
            const apiPropBag = {} as PropertyBag;
            propBags[projectRoot] = {
                config: apiPropBag,
                node: apiPropBag,
            };
        }
        return propBags[projectRoot];
    };
    const projectPropBags = getProjectBag();
    const apiPropBag = projectPropBags[apiType];
    if (extendBag) {
        // We want to mutate the prop bag, not replace it
        merge(
            apiPropBag,
            extendBag,
        );
    }
    return projectPropBags[apiType];
};

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
    if (!(project in optionsRegister)) {
        optionsRegister[project] = {};
    }

    return optionsRegister[project][type] = merge(
        defaultOptions,
        optionsRegister[project][type] || {},
        extendOptions || {},
        (to: any, from: any): any => {
            if (to instanceof Array) {
                return to.concat(from);
            }
        },
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
                    require.resolve("@babel/preset-typescript"),
                    require.resolve("../babel/preset"),
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
    return mergeOptions<TranspilerOptions<T>>(
        projectRoot,
        type,
        defaultOptions,
        addOptions,
    );
};