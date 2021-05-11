import path from "path";
import type { PackageJson } from "type-fest";

export const thisRoot = path.resolve(__dirname, "..", "..");
export const pkgJson: PackageJson = require(
    path.join(thisRoot, "package.json"),
);
export const pluginName = pkgJson.name;
