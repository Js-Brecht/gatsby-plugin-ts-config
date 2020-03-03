import * as path from 'path';
import {
    ConfigItem,
    CreateConfigItemOptions,
    createConfigItem,
    ConfigAPI,
    TransformOptions,
    PluginItem,
} from '@babel/core';

type ICreatePresetProps = string | {
    name: string;
    options?: object;
}
export const createPresets: (
    presets: ICreatePresetProps[],
    options?: CreateConfigItemOptions
) => ConfigItem[] = (presets, options) => {
    const configItems: ConfigItem[] = presets.map((curPreset) => {
        const presetName = typeof curPreset === 'string'
            ? curPreset
            : curPreset.name;

        const presetPath = path.isAbsolute(presetName)
            ? presetName
            : require.resolve(presetName);

        const presetOpts = typeof curPreset === 'string'
            ? {}
            : curPreset.options;

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

type PresetFn = (context: ConfigAPI, options: object) => TransformOptions;
type IAddOptsToPresetPlugin = (preset: PresetFn, pluginName: string, opts: object) => PresetFn;
export const addOptsToPreset: IAddOptsToPresetPlugin = (preset, name, opts) => {
    const checkItemPath = (item: PluginItem): boolean => {
        if (!(typeof item === 'string')) return false;
        const checkPath = name.replace(/^[/\\]+|[/\\]+$/g, '');
        const pattern = new RegExp(`[/]${checkPath.replace(/[/]/g, '\\/')}[/]`, 'i');
        return pattern.test(item.replace(/\\/g, '/'));
    };

    return (context, options = {}) => {
        const presetResult = preset(context, options);
        for (const collection of [presetResult.plugins, presetResult.presets]) {
            if (collection) {
                collection.forEach((item, idx) => {
                    if (checkItemPath(item)) {
                        collection![idx] = [
                            item,
                            opts,
                        ];
                    }
                });
            }
        }
        return presetResult;
    };
};