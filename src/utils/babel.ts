import * as path from 'path';
import {
    ConfigItem,
    CreateConfigItemOptions,
    createConfigItem,
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