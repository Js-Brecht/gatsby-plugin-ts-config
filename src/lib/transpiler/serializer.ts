import { serializeObject } from "@util/objects";

const serializerCache = new Map<any, string>();

export class Serializer {
    public static serialize(input: any) {
        if (!input) return;
        if (typeof input === "string") return input;
        if (serializerCache.has(input)) {
            return serializerCache.get(input);
        }

        const serialized = serializeObject(input);
        serializerCache.set(input, serialized);
        return serialized;
    }
}