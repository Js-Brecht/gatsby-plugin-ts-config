import { Module } from "@util/node";
import diff from "lodash/difference";


export const restoreExtensions = (restore: NodeJS.RequireExtensions) => {
    Object.entries(restore).forEach(([key, fn]) => {
        Module._extensions[key] = fn;
    });

    const removeKeys = diff(
        Object.keys(Module._extensions),
        Object.keys(restore),
    );
    if (removeKeys.length > 0) {
        removeKeys.forEach((remove) => {
            delete Module._extensions[remove];
        });
    }
};