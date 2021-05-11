import path from "path";
import findUp from "find-up";
import callsites from "callsites";
import { thisRoot } from "./constants";

import type { PackageJson } from "type-fest";

export const getCallSite = () => (
    callsites().find((site) => (
        // Get the first call site that isn't a part of this plugin
        !site.getFileName()?.startsWith(thisRoot)
    ))
);

type PackageJsonDetails = [string, PackageJson];

const pkgJsonCache: Record<string, PackageJsonDetails | null> = {};

export const getProjectPkgJson = (start = process.cwd()): PackageJsonDetails | null => {
    if (start in pkgJsonCache) return pkgJsonCache[start];

    const pkgJsonPath = findUp.sync("package.json", {
        cwd: start,
    });
    return pkgJsonCache[start] = (
        !pkgJsonPath
            ? null
            : [
                path.dirname(pkgJsonPath),
                require(pkgJsonPath) as PackageJson,
            ]
    );
};
