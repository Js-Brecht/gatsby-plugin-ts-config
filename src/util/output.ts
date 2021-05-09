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
            const copyErr = serializeError(err);
            err.message = `[${pluginName}]: ${err.message}`;
            Object.assign(this, copyErr);
        }
    }
}