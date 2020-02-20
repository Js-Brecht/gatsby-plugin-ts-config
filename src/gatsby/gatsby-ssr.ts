let gatsbySsr = {};
export const onPreRenderHTML = () => null;
try {
    gatsbySsr = require(__TS_CONFIG_ENDPOINT_PATH);
} catch (err) { // no gatsby-ssr found, return nothing
    // noop
}

// @ts-ignore
export = gatsbySsr;