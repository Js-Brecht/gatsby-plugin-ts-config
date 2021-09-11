import path from "path";
import type { PackageJson } from "type-fest";

export const gatsbyTsEnv = (nm: string) => `__GATSBY_TS_${nm.toUpperCase()}__`;
export const parentEnv = gatsbyTsEnv("PPID");
export const depthEnv = gatsbyTsEnv("DEPTH");
export const runTypeEnv = gatsbyTsEnv("RUN_TYPE");

export const settingsFile = ".gatsby-ts";

export const thisRoot = path.resolve(__dirname, "..", "..");
export const pkgJson: PackageJson = require(
    path.join(thisRoot, "package.json"),
);
export const pluginName = pkgJson.name;

export const apiTypeKeys = ["config", "node"] as const;