import merge from "lodash/mergeWith";
import type {
    ApiType,
    PropertyBag,
} from "@typeDefs/internal";

type ApiPropertyBags = {
    [K in ApiType]: PropertyBag;
}
const propBags: Record<string, ApiPropertyBags> = {};

const getProjectPropBags = (
    projectRoot: string,
): ApiPropertyBags => {
    if (!propBags[projectRoot]) {
        const apiPropBag = {} as PropertyBag;
        propBags[projectRoot] = {
            config: apiPropBag,
            node: apiPropBag,
        };
    }
    return propBags[projectRoot];
};

export const getPropBag = (
    apiType: ApiType,
    projectRoot: string,
    extendBag = {} as PropertyBag,
): PropertyBag => {
    const projectPropBags = getProjectPropBags(projectRoot);
    const apiPropBag = projectPropBags[apiType];
    if (extendBag) {
        // We want to mutate the prop bag, not replace it
        merge(
            apiPropBag,
            extendBag,
        );
    }
    return projectPropBags[apiType];
};