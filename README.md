## Configure Gatsby to use Typescript for configuration files

[![paypal](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=J3ZGS46A4C5QA&currency_code=USD&source=url)

> This plugin will allow you to write your `gatsby-*` configuration files in Typescript.

---

> For v1 documentation, see the [old docs](./old/README.md)

### Installation

* Install using your package manager

  ```shell
  npm install -D gatsby-plugin-ts-config
  ```

---

### Usage

The cleanest way to use this plugin is to use `gatsby-config.js` and `gatsby-node.js`
as pointers to your `.ts` files that you keep in another directory.  This isn't required,
though.  All you need initially is `gatsby-config.js`

To point `gatsby-config.js` and/or `gatsby-node.js` to `.ts` files:

```js
// gatsby-config.js
const { useGatsbyConfig } = require("gatsby-plugin-ts-config");

// If static analysis purposes, you can use a callback with a require() statement
module.exports = useGatsbyConfig(() => require("./config/gatsby-config"), opts);

// A simpler method is to just use the filename
module.exports = useGatsbyConfig("./config/gatsby-config", opts);

// Or you can just return the `gatsby-config` object from the callback
module.exports = useGatsbyConfig(
  () => ({
    siteMetadata: {
      ...
    },
    plugins: [
      {
        resolve: ...,
        options: ...,
      }
    ]
  }),
  opts
)
```

Once `useGatsbyConfig` is called from `gatsby-config`, `gatsby-node.ts` can exist in your site's
root directory.  `useGatsbyConfig` is not required, however, if you do not wish to have your
`gatsby-config` in Typescript.  You can use this plugin directly from `gatsby-node` if you wish.

```js
// gatsby-node.js
const { useGatsbyNode } = require("gatsby-plugin-ts-config");

// All of the same usage patterns for `useGatsbyConfig` are valid for `useGatsbyNode`
// as well
module.exports = useGatsbyNode(() => require("./config/gatsby-node"), opts);
```

### Contributing / Issues

If you feel a feature is missing, or you find a bug, please feel free to file an issue
at <https://github.com/Js-Brecht/gatsby-plugin-ts-config/issues>.

I would also welcome any additions anybody would like to make.

### Donations

If you enjoyed using this plugin, and you'd like to help support its development, you're welcome to donate!

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=J3ZGS46A4C5QA&currency_code=USD&source=url)
