import * as path from 'path';
import * as fs from 'fs';
import mkdirp from 'mkdirp';
import {
    transformSync,
    TransformOptions,
    createConfigItem,
    ConfigItem,
    CreateConfigItemOptions,
} from '@babel/core';
import template from '@babel/template';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import { parse } from '@babel/parser';
import { StringLiteral } from '@babel/types';

import { fileExists } from './fs-tools';
import { ITransformTarget } from './transform-targets';

interface ICallee {
    name: string;
}
type ICalleeArguments = {
    value: string;
}[];
interface IGetFileImports {
    ast: ReturnType<typeof parse>;
}
const getFileImports = ({
    ast,
}: IGetFileImports): string[] => {
    const imports: string[] = [];
    traverse(ast, {
        CallExpression: (path) => {
            const callee = path.node.callee as ICallee;
            if (callee.name && callee.name === 'require') {
                imports.push(...(
                    (path.node.arguments as ICalleeArguments).map((arg) => arg.value)
                        .filter((fileName) => !imports.includes(fileName))
                ));
            }
        },
    });
    return imports;
};

export interface ITransformCodeToFileProps extends ITransformTarget {
    cacheDir: string;
    opts: TransformOptions;
}
export const transformCodeToFile = ({
    srcFile,
    targetFileName,
    relativePath,
    cacheDir,
    opts,
}: ITransformCodeToFileProps): {
    cacheFile: string;
    imports: string[];
} => {
    const imports: string[] = [];
    const cacheFile = path.join(cacheDir, relativePath, targetFileName);
    const code = fs.readFileSync(srcFile).toString();
    const output = transformSync(code, {
        ...opts,
        filename: srcFile,
    });

    if (output && output.code) {
        const cacheFileDir = path.dirname(cacheFile);
        if (!fileExists(cacheFileDir)) mkdirp.sync(cacheFileDir);

        fs.writeFileSync(cacheFile, output.code);

        const ast = parse(output.code);
        imports.push(...getFileImports({
            ast,
        }));
    }
    return {
        cacheFile,
        imports,
    };
};

export interface IInterpolateSpec {
    __TS_CONFIG_ENDPOINT_PATH: StringLiteral;
}
export interface ITransformCodeToTemplateProps {
    srcFile: string;
    targetFile: string;
    templateSpec: IInterpolateSpec;
}
export const transformCodeToTemplate = ({
    srcFile,
    targetFile,
    templateSpec,
}: ITransformCodeToTemplateProps): boolean => {
    try {
        const code = fs.readFileSync(srcFile).toString();
        const buildTemplate = template.program(code);
        const ast = buildTemplate(templateSpec);
        const output = generate(ast).code;
        fs.writeFileSync(targetFile, output);
        return true;
    } catch (err) {
        // noop
    }
    return false;
};

interface ICreatePresetProps {
    name: string;
    options?: object;
}
export const createPresets: (
    presets: ICreatePresetProps[],
    options?: CreateConfigItemOptions
) => ConfigItem[] = (presets, options) => {
    const configItems: ConfigItem[] = presets.map((curPreset) => {
        const presetPath = require.resolve(curPreset.name);
        const presetOpts = curPreset.options;
        const createOpts: CreateConfigItemOptions = {
            ...options,
            type: 'preset',
        };
        return createConfigItem(
            [
                presetPath,
                presetOpts,
            ],
            createOpts,
        );
    });
    return configItems;
};