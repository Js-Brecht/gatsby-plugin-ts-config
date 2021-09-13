import babelRegister from "@babel/register";
import { register as tsNodeRegister } from "ts-node";

import { Project } from "@lib/project";
import { AllowedFiles } from "./allowed-files";
import { ImportHandler } from "./import-handler";
import { TranspilerSettings, GenericArgs } from "./transpiler-settings";
import { restoreExtensions } from "./restore-extensions";

import type {
    TranspilerArgs,
    TranspileType,
    TranspilerOptions,
    IgnoreFn,
    IgnoreHookFn,
} from "@typeDefs";
import { Module } from "@util/node";

const extensions = [".ts", ".tsx", ".js", ".jsx"];
const origModuleExtensions = {
    ...Module._extensions,
};

const ignoreRules: IgnoreFn[] = [
    // Module must not be a node_modules dependency
    (fname) => /node_modules/.test(fname),
];

const getIgnore = (
    filename: string,
    rules: (IgnoreFn | IgnoreHookFn)[],
    orig: boolean,
) => (
    AllowedFiles.allowed(filename)
        ? false
        : rules.some((rule) => rule(filename, !!orig))
);

const ignore: IgnoreFn = (filename) => {
    if (filename.endsWith(".pnp.js")) return true;
    const importHandler = TranspilerSettings.importHandler;
    const hooks = TranspilerSettings.ignoreHooks;

    if (importHandler) {
        importHandler(filename);
    }

    const origIgnore = getIgnore(filename, ignoreRules, false);
    const ignoreFile = hooks
        ? getIgnore(filename, hooks, origIgnore)
        : origIgnore;
    return !!ignoreFile;
};

const only: IgnoreFn = (filename) => {
    return !ignore(filename);
};

const register = (args: GenericArgs) => {
    const {
        type: transpileType,
        options: transpilerOpts,
    } = args;

    restoreExtensions(origModuleExtensions);

    switch (transpileType) {
        case "ts-node": {
            const opts = transpilerOpts as TranspilerOptions<"ts-node">;
            const tsNodeService = tsNodeRegister(opts);
            tsNodeService.ignored = ignore;
            break;
        }
        case "babel": {
            const opts = transpilerOpts as TranspilerOptions<"babel">;
            babelRegister({
                ...opts,
                extensions,
                only: [only],
            });
            break;
        }
    }

    TranspilerSettings.saveExtensions(require.extensions);
};

export const setTranspiler = (
    optKey: string,
    transpileArgs: TranspilerArgs<TranspileType>,
    project: Project,
) => {
    AllowedFiles.addDir(project.projectRoot);

    const restoreImportHandler = ImportHandler.push(project);
    const initialSettings = TranspilerSettings.push(
        optKey,
        transpileArgs,
        project,
    );

    if (initialSettings) {
        const {
            args: registerArgs,
        } = initialSettings;

        register(registerArgs);
    }

    return () => {
        AllowedFiles.removeDir(project.projectRoot);
        restoreImportHandler();

        const restoreSettings = TranspilerSettings.pop();

        // No prior transpiler set.  Just restore the original
        // module extensions
        if (restoreSettings === -1) {
            restoreExtensions(origModuleExtensions);
            return;
        }

        // The base transpiler is already active
        if (!restoreSettings) return;
        const {
            args: restoreArgs,
            extensions: restoreExt = origModuleExtensions,
        } = restoreSettings;

        switch (restoreArgs.type) {
            /**
             * In order to restore extensions for babel, we need to
             * re-register the transpiler.
             */
            case "babel": {
                register(restoreArgs);
                break;
            }
            /**
             * ts-node should just be able to restore the prior set of
             * module extensions
             */
            case "ts-node": {
                restoreExtensions(restoreExt);
                break;
            }
        }
    };
};