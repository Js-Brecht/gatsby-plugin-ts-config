import debug from "debug";
import { Logger } from "tslog";
import { serializeError } from "serialize-error";

import { pluginName } from "./constants";

export const logger = new Logger({
    instanceName: pluginName,
    name: pluginName,
    displayDateTime: false,
    displayLogLevel: true,
});

export const getDebugLogger = (nm: string, len = 1) => (
    Object.assign(
        debug(`gatsby-ts:${nm}`),
        {
            new: (newNm: string) => getDebugLogger(`${nm}:${newNm}`, len + 1),
            len,
        },
    )
);

export type Debugger = ReturnType<typeof getDebugLogger>;

export class PluginError extends Error {
    constructor(err: string | Error | PluginError) {
        if (err instanceof PluginError) return err;
        super(`[${pluginName}]: ${err}`);

        if (err instanceof Error) {
            err.message = `[${pluginName}]: ${err.message}`;
            const copyErr = serializeError(err);
            Object.assign(this, copyErr);
        }
    }
}