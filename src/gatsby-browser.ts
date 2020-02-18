let gatsbyBrowser = {};
try {
    gatsbyBrowser = require(`${__TS_CONFIG_DIR}/gatsby-browser`);
} catch (err) { // no gatsby-browser found, return nothing
    // noop
}
export = gatsbyBrowser;