// This has to be faked, so that Gatsby will include this plugin's SSR file
// when running SSR
exports.onPreRenderHTML = () => null;

module.exports = require('./dist/gatsby/gatsby-ssr');