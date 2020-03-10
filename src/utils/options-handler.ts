import * as path from 'path';
import { keys } from 'ts-transformer-keys';
import mergeWith from 'lodash.mergewith';
import { TsConfigJson } from 'type-fest';
import { TransformOptions as BabelTransformOptions } from '@babel/core';
import { TsConfigOptions, RegisterOptions as TSNodeRegisterOptions } from 'ts-node';
import { IGlobalOpts, IPublicOpts } from "../types";
import { addOptsToPreset } from './babel';
import { getAbsoluteRelativeTo } from '../utils/fs-tools';


const publicProps = keys<IPublicOpts>();

class OptionsHandler {
    private opts = {} as IGlobalOpts;
    private publicOpts = {} as IPublicOpts;

    public set(args: Partial<IGlobalOpts>) {
        this.opts = {
            ...this.opts,
            ...args,
        };
        this.publicOpts = Object.entries(this.opts)
            .filter(([key]) => publicProps.includes(key as keyof IPublicOpts))
            .reduce((acc, [key, val]) => {
                acc[key as keyof IPublicOpts] = val;
                return acc;
            }, {} as IPublicOpts);
    }

    public get(): IGlobalOpts {
        return this.opts;
    }

    public public(): IPublicOpts {
        return this.publicOpts;
    }

    private mergeOptionsWithConcat(to: any, from: any): any {
        if (to instanceof Array) {
            return to.concat(from);
        }
    }

    public setTsNodeOpts(opts: TSNodeRegisterOptions = {}): Required<IGlobalOpts>['tsNodeOpts'] {
        const compilerOptions: TsConfigJson['compilerOptions'] = {
            module: "commonjs",
            target: "es2015",
            allowJs: false,
            noEmit: true,
            declaration: false,
            importHelpers: true,
            resolveJsonModule: true,
            jsx: "preserve",
            // sourceMap: true,
        };

        this.opts.tsNodeOpts = mergeWith(
            {
                project: getAbsoluteRelativeTo(this.opts.projectRoot, opts.project || 'tsconfig.json'),
                files: true,
                compilerOptions,
            },
            opts,
            this.mergeOptionsWithConcat,
        );
        return this.opts.tsNodeOpts;
    }

    public setBabelOpts(opts?: BabelTransformOptions): Required<IGlobalOpts>['babelOpts'] {
        this.opts.babelOpts = mergeWith(
            {
                sourceMaps: "inline",
                sourceRoot: this.opts.projectRoot,
                cwd: this.opts.projectRoot,
                presets: [
                    require.resolve('@babel/preset-typescript'),
                    addOptsToPreset(
                        require('babel-preset-gatsby-package'),
                        '@babel/plugin-transform-runtime',
                        {
                            absoluteRuntime: path.dirname(require.resolve('@babel/runtime/package.json')),
                        },
                    ),
                ],
            },
            opts,
            this.mergeOptionsWithConcat,
        );
        return this.opts.babelOpts;
    }
}

export default new OptionsHandler();