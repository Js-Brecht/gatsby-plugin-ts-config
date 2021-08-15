import { Logger } from "tslog";
import { serializeError } from "serialize-error";

import { pluginName } from "./constants";

export const logger = new Logger({
    instanceName: pluginName,
    name: pluginName,
    displayDateTime: false,
    displayLogLevel: true,
});

export class PluginError extends Error {
    constructor(err: string | Error) {
        super(`[${pluginName}]: ${err}`);

        if (err instanceof Error) {
            err.message = `[${pluginName}]: ${err.message}`;
            const copyErr = serializeError(err);
            Object.assign(this, copyErr);
        }
    }
}