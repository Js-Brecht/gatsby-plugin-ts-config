import merge from "lodash/mergeWith";
import type { PropertyBag } from "@typeDefs/internal";

const propBags: Record<string, PropertyBag> = {};

export const getPropBag = (
    projectRoot: string,
    extendBag = {} as PropertyBag,
): PropertyBag => {
    const propBag = propBags[projectRoot] = (
        propBags[projectRoot] || {} as PropertyBag
    );
    if (extendBag) {
        // We want to mutate the prop bag, not replace it
        merge(
            propBag,
            extendBag,
        );
    }
    return propBag;
};