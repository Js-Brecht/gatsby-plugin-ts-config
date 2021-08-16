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