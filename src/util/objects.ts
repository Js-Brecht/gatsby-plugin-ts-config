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

export const serializeObject = (obj: any) => (
    JSON.stringify(
        obj,
        (key, val) => (
            val && (
                val instanceof RegExp ||
                typeof val === "function"
            ) ? val.toString() : val
        ),
    )
);

export const objectsAreEqual = (obj1: any, obj2: any) => {
    obj1 = serializeObject(obj1);
    obj2 = serializeObject(obj2);
    return obj1 === obj2;
};