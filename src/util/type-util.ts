import type { TranspileType, PluginModule, ApiType } from "@typeDefs/internal";

export const isBabelType = (type: TranspileType): type is "babel" => (
    type === "babel"
);
export const isTsNodeType = (type: TranspileType): type is "ts-node" => (
    type === "ts-node"
);

export const isGatsbyConfig = (
    type: ApiType,
    mod: PluginModule<any>,
): mod is PluginModule<"config", true> => (
    type === "config"
);