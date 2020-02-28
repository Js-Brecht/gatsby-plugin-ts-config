let gatsbyBrowser = {};
try {
    gatsbyBrowser = require(__TS_CONFIG_ENDPOINT_PATH);
} catch (err) { // no gatsby-browser found, return nothing
    // noop
}
export = gatsbyBrowser;