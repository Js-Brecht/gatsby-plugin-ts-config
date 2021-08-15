[babel-docs]: https://babeljs.io/docs/en/options#config-loading-options
[tsnode-docs]: https://github.com/TypeStrong/ts-node#cli-and-programmatic-options

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
root directory.  However, if you do not wish to have your `gatsby-config` in Typescript, `useGatsbyConfig` is
not required.  You can use this plugin directly from `gatsby-node` if you wish.

```js
// gatsby-node.js
const { useGatsbyNode } = require("gatsby-plugin-ts-config");

// All of the same usage patterns for `useGatsbyConfig` are valid for `useGatsbyNode`
// as well
module.exports = useGatsbyNode(() => require("./config/gatsby-node"), opts);
```

### Options

* `props`: `Object`

  This "property bag" is an object that can take any shape you wish.  When a `gatsby-*` module is defined
  with a function for a default export, these `props` will be passed in the second parameter.

  The property bag is mutable, so any changes you make to it will be passed to the next module

  * Each project gets its own property bag.  They do not mix, which means `props` defined by your default
    site will not be passed down to plugins.
    * One difference when using local plugins: The property bag will be **_copied_** and then passed to the
      local plugin.
  * If `props` is defined in both `useGatsbyConfig` and `useGatsbyNode`, the values in `useGatsbyNode` will be
    **_merged_** into the property bag before being passed on to default export of the module.

* `type`: `"babel" | "ts-node"`

  Determines which transpiler to use.

* `transpilerOptions`: `Object`

  Any additional options you'd like to provide to the transpiler

  * When `type === "babel"`: See the [babel options documentation][babel-docs]
  * When `type === "ts-node"`: See the [ts-node options documentation][https://github.com/TypeStrong/ts-node#cli-and-programmatic-options]

### Default exports

The default export is supported for your `gatsby-*.ts` files.  This is important to note, because Typescript
prefers that you use either the default export, or named exports.

While named exports are absolutely supported as well, some people may prefer to build their module object
and then export it all at once.  In that case, you may use the default export.

In other cases, you may want to perform some more advanced actions during the module processing.  For this,
you may export a function as the default export.  They will be called in order
(`gatsby-config` -> `gatsby-node`), and used to set the module's exports so that Gatsby can read them.

#### Default export function

`gatsby-config.ts` or `gatsby-node.ts` may export a function as the default export.  This will be called with
some details regarding the transpiling process, as well as some helpful information about the current project.

These modules may export this function as the default export whether or not they are in the root of your
site, as is the Gatsby standard.  However, since this plugin needs to get kicked off by one of the
`useGatsby*` plugins, `gatsby-config` may not be accessible from the root.

These functions should return the object that Gatsby generally expects.  For `gatsby-config`, it would be
the same object you would define in `gatsby-config.js`.  For `gatsby-node`, it would be the `gatsby-node`
APIs.

#### Function parameters

The default export function will receive two parameters:

1. The transpiler & project information
    * `projectRoot`: The absolute path to the current project.
    * `imports`: All of the imports used by your `gatsby-*` modules.
      * This is structured by API Type, and then by plugin + API Type
        * `config`: `string[]`
        * `node`: `string[]`
        * `plugins`: `Object`
          * `[pluginName: string]`: `Object`
            * `config`: `string[]`
            * `node`: `string[]`

2. The property bag defined in the bootstrap (`useGatsby*`) functions.

### Contributing / Issues

If you feel a feature is missing, or you find a bug, please feel free to file an issue
at <https://github.com/Js-Brecht/gatsby-plugin-ts-config/issues>.

I would also welcome any additions anybody would like to make.

### Donations

If you enjoyed using this plugin, and you'd like to help support its development, you're welcome to donate!

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=J3ZGS46A4C5QA&currency_code=USD&source=url)
