import path from "path";
import findUp from "find-up";
import callsites from "callsites";
import { thisRoot } from "./constants";
import { PluginError } from "./output";

import type { ProjectMetaFn } from "@typeDefs";

import type { PackageJson } from "type-fest";

export const getCallSite = () => (
    callsites().find((site) => (
        // Get the first call site that isn't a part of this plugin
        !site.getFileName()?.startsWith(thisRoot)
    ))
);

type PackageJsonDetails = {
    projectRoot: string,
    pkgJson: PackageJson
};

const pkgJsonStartCache: Record<string, PackageJsonDetails | null> = {};
const pkgJsonCache: Record<string, PackageJsonDetails | null> = {};

export const getProjectPkgJson = (start = process.cwd()): PackageJsonDetails | null => {
    if (start in pkgJsonStartCache) return pkgJsonStartCache[start];

    const pkgJsonPath = findUp.sync("package.json", {
        cwd: start,
    });

    return pkgJsonStartCache[start] = (
        !pkgJsonPath
            ? null
            : pkgJsonCache[pkgJsonPath] = (
                pkgJsonCache[pkgJsonPath] || {
                    projectRoot: path.dirname(pkgJsonPath),
                    pkgJson: require(pkgJsonPath) as PackageJson,
                }
            )
    );
};

export type ProjectMeta = {
    projectRoot: string;
    projectName: string;
    pkgJson: PackageJson;
    callSite?: callsites.CallSite;
}

export const getProject = (): ProjectMeta => {
    const callSite = getCallSite();
    const callFile = callSite?.getFileName();
    if (!callFile) {
        throw new PluginError("Unable to determine call site");
    }

    const callDir = path.dirname(callFile);
    const { projectRoot, pkgJson } = getProjectPkgJson(callDir) || {};
    if (!pkgJson || !projectRoot) {
        throw new PluginError("Unable to locate project root");
    }

    const projectName = pkgJson.name;
    if (!projectName) {
        throw new PluginError("Unable to determine caller's project name");
    }

    return {
        projectRoot,
        projectName,
        pkgJson,
        callSite,
    };
};

export const projectMetaSymbol = Symbol("project_meta_function");

export const createProjectMetaFn = <
    T extends ProjectMetaFn<any, any>
>(cb: T): ProjectMetaFn<any, any> => {
    cb[projectMetaSymbol] = true;
    return cb;
};