const serializerCache = new Map<any, string>();

const serializeObject = (obj: any) => (
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

class SerializerImpl {
    public serialize(input: any) {
        if (!input) return;
        if (typeof input === "string") return input;
        if (serializerCache.has(input)) {
            return serializerCache.get(input);
        }

        const serialized = serializeObject(input);
        serializerCache.set(input, serialized);
        return serialized;
    }

    public isEqual(obj1: any, obj2: any) {
        obj1 = this.serialize(obj1);
        obj2 = this.serialize(obj2);
        return obj1 === obj2;
    }
}

export const Serializer = new SerializerImpl();