"use strict";

exports.onPreRenderHTML = function () {
    return null;
};

module.exports = require(__TS_CONFIG_CACHE_DIR__ + "gatsby-ssr.js");