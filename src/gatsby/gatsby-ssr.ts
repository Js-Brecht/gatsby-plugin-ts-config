let gatsbySsr = {};
export const onPreRenderHTML = () => null;
if (!__TS_CONFIG_IGNORE_SSR) {
    try {
        gatsbySsr = require(`${__TS_CONFIG_DIR}/gatsby-ssr`);
    } catch (err) { // no gatsby-ssr found, return nothing
        // noop
    }
}

// @ts-ignore
export = gatsbySsr;