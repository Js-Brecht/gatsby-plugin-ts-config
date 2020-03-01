import { keys } from 'ts-transformer-keys';
import mergeWith from 'lodash.mergewith';
import { TransformOptions } from '@babel/core';
import { IGlobalOpts, IPublicOpts } from "../types";

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

    public setBabelOpts(opts?: TransformOptions): Required<IGlobalOpts>['transformOpts'] {
        this.opts.transformOpts = mergeWith(
            {
                sourceMaps: true,
                sourceRoot: this.opts.projectRoot,
                cwd: this.opts.projectRoot,
                presets: [
                    require.resolve('@babel/preset-typescript'),
                    require.resolve('babel-preset-gatsby-package'),
                ],
            },
            opts,
            this.mergeOptionsWithConcat,
        );
        return this.opts.transformOpts;
    }
}

export default new OptionsHandler();