import * as path from 'path';
import mergeWith from 'lodash.mergewith';
import { keys } from 'ts-transformer-keys';
import { TsConfigJson } from 'type-fest';
import { TransformOptions as BabelTransformOptions } from '@babel/core';
import { RegisterOptions as TSNodeRegisterOptions } from 'ts-node';
import { addOptsToPreset } from './babel';
import { getAbsoluteRelativeTo } from '../utils/fs-tools';
import { compilePlugins } from './endpoints';

import type {
    IGlobalOpts,
    IPublicOpts,
    GatsbyEndpointResolverKeys,
    IGatsbyPluginDef,
    IGatsbyPluginWithOpts,
    IPluginDetails,
    IPluginDetailsCallback,
} from "../types";
import { resolvePluginPath } from './endpoints';

const publicProps = keys<IPublicOpts>();

export interface IResolvePlugins {
    <T extends IGatsbyPluginDef = IGatsbyPluginDef>(plugins: T[] | IPluginDetailsCallback<T>): void;
    <T extends IGatsbyPluginDef = IGatsbyPluginDef>(plugins: T[], pluginsCb?: IPluginDetailsCallback<T>): void;
}

class OptionsHandler {
    private opts = {} as IGlobalOpts;
    private _plugins: IPluginDetails[] = [];
    private _pluginCb: IPluginDetailsCallback[] = [];
    private _extendedPlugins: IPluginDetails[] = [];

    public set(args: Partial<IGlobalOpts>) {
        this.opts = {
            ...this.opts,
            ...args,
        };
    }

    private doResolvePlugins = <T extends IGatsbyPluginDef = IGatsbyPluginDef>(plugins: T[]): IPluginDetails[] => {
        return plugins.reduce((acc, plugin) => {
            const curPlugin = typeof plugin === 'string'
                ? plugin as string
                : plugin as IGatsbyPluginWithOpts;
            const pluginDetails = (typeof curPlugin === 'string'
                ? {
                    name: curPlugin,
                    options: {},
                } : {
                    name: curPlugin.resolve,
                    options: curPlugin.options,
                }) as IPluginDetails;
            pluginDetails.path = resolvePluginPath({
                projectRoot: this.opts.projectRoot,
                pluginName: pluginDetails.name,
            });
            if (pluginDetails.path) {
                acc.push(pluginDetails);
            } else {
                throw `[gatsby-plugin-ts-config] Unable to locate plugin ${pluginDetails.name}`;
            }
            return acc;
        }, [] as IPluginDetails[]);
    }

    public doExtendPlugins = (compile = false): void => {
        if (this.extendedPlugins.length > 0) return;
        const pluginDetails = this._pluginCb.reduce((acc, pluginCb) => {
            const plugins = this.doResolvePlugins(
                pluginCb(this.public()),
            );
            if (compile) {
                compilePlugins({
                    plugins,
                });
            }
            acc.push(...plugins);
            return acc;
        }, [] as IPluginDetails[]);
        this._extendedPlugins.push(...pluginDetails);
        this._plugins.push(...this._extendedPlugins);
    }

    public includePlugins: IResolvePlugins = <
        T extends IGatsbyPluginDef = IGatsbyPluginDef
    >(
        plugins: T[] | IPluginDetailsCallback<T>,
        pluginsCb?: IPluginDetailsCallback<T>,
    ) => {
        if (plugins instanceof Array) {
            this._plugins.push(...this.doResolvePlugins(plugins));
        } else {
            this._pluginCb.push(plugins);
        }
        if (pluginsCb) {
            this._pluginCb.push(pluginsCb);
        }
    }

    private copyPlugins = (plugins: IPluginDetails[]): IPluginDetails[] => {
        return [
            ...plugins.map((plugin) => ({
                ...plugin,
            })),
        ];
    }
    public get plugins(): IPluginDetails[] {
        return this.copyPlugins(this._plugins);
    }
    public get extendedPlugins(): IPluginDetails[] {
        return this.copyPlugins(this._extendedPlugins);
    }

    private addPluginChainedImport = (
        endpoint: GatsbyEndpointResolverKeys,
        name: string,
        filePath: string,
    ) => {
        const endpoints = this.opts.endpoints;
        if (!endpoints.plugin) endpoints.plugin = {};
        if (!endpoints.plugin[name]) endpoints.plugin[name] = {};
        if (!endpoints.plugin[name][endpoint]) endpoints.plugin[name][endpoint] = [];
        endpoints.plugin[name][endpoint]?.push(filePath);
    }

    public addChainedImport = (
        endpoint: GatsbyEndpointResolverKeys,
        filepath: string,
        pluginName?: string,
    ) => {
        if (pluginName) {
            return this.addPluginChainedImport(endpoint, pluginName, filepath);
        }
        if (!this.opts.endpoints[endpoint]) this.opts.endpoints[endpoint] = [];
        if (this.opts.endpoints[endpoint]![0] === filepath) return;
        this.opts.endpoints[endpoint]!.push(filepath);
    }

    public get = (): IGlobalOpts => {
        return this.opts;
    }

    public public = (): IPublicOpts => {
        const entries = Object.entries(this.opts);
        const publicOpts = entries
            .filter(([key]) => publicProps.includes(key as keyof IPublicOpts))
            .reduce((acc, [key, val]) => {
                acc[key as keyof IPublicOpts] = val;
                return acc;
            }, {} as IPublicOpts);
        return publicOpts;
    }

    private mergeOptionsWithConcat = (to: any, from: any): any => {
        if (to instanceof Array) {
            return to.concat(from);
        }
    }

    public setTsNodeOpts = (opts: TSNodeRegisterOptions = {}): Required<IGlobalOpts>['tsNodeOpts'] => {
        const compilerOptions: TsConfigJson['compilerOptions'] = {
            module: "commonjs",
            target: "es2015",
            allowJs: true,
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

    public setBabelOpts = (opts?: BabelTransformOptions): Required<IGlobalOpts>['babelOpts'] => {
        this.opts.babelOpts = mergeWith(
            {
                sourceMaps: "inline",
                sourceRoot: this.opts.projectRoot,
                cwd: this.opts.projectRoot,
                presets: [
                    require.resolve('@babel/preset-typescript'),
                    require.resolve('./preset'),
                    // addOptsToPreset(
                    //     require('babel-preset-gatsby-package'),
                    //     '@babel/plugin-transform-runtime',
                    //     {
                    //         absoluteRuntime: path.dirname(require.resolve('@babel/runtime/package.json')),
                    //     },
                    // ),
                ],
            },
            opts,
            this.mergeOptionsWithConcat,
        );
        return this.opts.babelOpts;
    }
}

export default new OptionsHandler();