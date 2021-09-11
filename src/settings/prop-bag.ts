import merge from "lodash/mergeWith";
import type { PropertyBag } from "@typeDefs/internal";

const propBags: Record<string, PropertyBag> = {};
const propBagsAdded: Record<string, WeakSet<PropertyBag>> = {};

export const getPropBag = (
    projectRoot: string,
    extendBag?: PropertyBag,
): PropertyBag => {
    const propBag = propBags[projectRoot] = (
        propBags[projectRoot] || {} as PropertyBag
    );
    const addedBags = propBagsAdded[projectRoot] = (
        propBagsAdded[projectRoot] || new WeakSet()
    );
    if (extendBag && !addedBags.has(extendBag)) {
        // We want to mutate the prop bag, not replace it
        merge(
            propBag,
            extendBag,
        );
        addedBags.add(extendBag);
    }
    return propBag;
};