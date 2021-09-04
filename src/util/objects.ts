import loMergeWith from "lodash/mergeWith";
import loMerge from "lodash/merge";

export const merge: typeof loMerge = <T extends any[]>(
    ...objects: T
) => {
    const args = [
        ...objects,
        (to: any, from: any): any => {
            if (to instanceof Array) {
                return to.concat(from);
            }
        },
    ] as unknown as Parameters<typeof loMergeWith>;
    return loMergeWith(...args);
};

type ToArray<T> = T extends Array<any>
    ? T
    : Array<T>

export const arrayify = <T>(input: T): ToArray<T> => (
    Array.isArray(input) ? input : [input]
) as ToArray<T>;


export const removeFromArray = <T>(arr: T[], val: T, firstOnly = false) => {
    for (let idx = arr.length - 1; idx >= 0; --idx) {
        const cur = arr[idx];
        if (cur === val) {
            arr.splice(idx, 1);
            if (firstOnly) return;
        }
    }
};

export const popArray = <T>(arr: T[], val: T) => {
    removeFromArray(arr, val, true);
};