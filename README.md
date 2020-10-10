## Configure Gatsby to use Typescript for configuration files

[![paypal](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=J3ZGS46A4C5QA&currency_code=USD&source=url)

> This plugin will allow you to write your `gatsby-*` configuration files in Typescript.

---

Table of Contents:
1. Basic Information
    1. [Installation](#installation)
    2. [Usage](#usage)
    3. [Plugin Options](#plugin-options)
    4. [Determining the Interpreter](#determining-the-interpreter)
    5. [Site Implementation](#site-implementation)

2. Additional Information
    1. [Extended Usage](./docs/EXTENDED-USAGE.md)
    2. [Gatsby API](./docs/GATSBY-API.md)
    3. [Property Bag](./docs/PROPERTY-BAG.md)
    4. [Gatsby Config Utilities](./docs/GATSBY-CONFIG-UTILS.md)

---

### Installation

* Install using your project manager

  ```shell
  npm install -D gatsby-plugin-ts-config
  ```

---

> ## IMPORTANT:
>
> Before reading below, please note that it is recommended for you to define a `configDir` in
> the plugin options.
>
> Because of the process this plugin has to follow so that it can interpret your typescript
> configuration files, some conflicts may occur regarding node ownership if you keep your
> `gatsby-node.ts` in the project root.  In order to place that file in a sub-directory, you
> will need to define a `configDir`, and you will also need to put the rest of your
> configurations in the same place.

---

### Usage

You will still need to define, at minimum, one `.js` Gatsby configuration: `gatsby-config.js`.

As usual, it needs to be in the root of your project.  You will then use _**it**_ to call
this plugin, and the rest of your configuration will be in Typescript files.

* The easy way

  * You can use the `generateConfig` utility that is exported by `gatsby-plugin-ts-config` to set
    up the plugin array the way it needs to be.

  * Doing it this way allows your IDE to read the type interface for the options, so you can use
    intellisense while defining the plugin options.

  ```js
  // gatsby-config.js
  const { generateConfig } = require('gatsby-plugin-ts-config');
  module.exports = generateConfig();
  ```

* The common way

  * _This can also be done the normal way.  The utility above just makes it easy_

  ```js
  // gatsby-config.js
  module.exports = {
    plugins: [
      `gatsby-plugin-ts-config`,
    ]
  }
  ```

* Configuration complete

  * After that, all of your configuration files can be written in Typescript:

    * gatsby-browser.ts
    * gatsby-config.ts
    * gatsby-node.ts
    * gatsby-ssr.ts

**For extended usage examples, see the [Extended Usage](./docs/EXTENDED-USAGE.md) chapter**

---

### Plugin Options

* `projectRoot`: `{string}`
  * Default: `process.cwd()`
  * This defines your project's root directory for the plugin.  All folder/file resolutions will be performed
    relative to this directory.

* `configDir`: `{string}`
  * Default: `projectRoot`
  * You can define a folder, relative to `projectRoot`, that will store your Typescript configuration files.
    If you do not define this option, then it will automatically use `projectRoot`.

* `babel`: `{boolean|TransformOptions}`
  * Default: `true`
  * Setting this to `true`, or an object, will cause the plugin to use `babel` for transforming
    typescript configurations.
  * If an object is defined, it must contain options valid for `babel`.  See the
    [babel options documentation](https://babeljs.io/docs/en/options#config-loading-options) for
    a description of the available options.  Anything you can put in `.babelrc` can be put here.
  * See [Determining the interpreter](#determining-the-interpreter) below for details on how
    the interpeter is chosen

* `tsNode`: `{boolean|RegisterOptions}`
  * Default: `false`
  * Setting this to `true` or an object will cause `ts-node` to be used, so long as `babel` is
    a falsy value.
  * If an object, you may use any options that are valid for `ts-node`'s `register()` function.
    See the [ts-node options documentation here](https://github.com/TypeStrong/ts-node#cli-and-programmatic-options)
  * See [Determining the interpreter](#determining-the-interpreter) below for details on how
    the interpeter is chosen

* `props`: `{object}`
  * Default: `{}`
  * Reference: [docs](docs/PROPERTY-BAG.md)
  * This object will be passed to the default functions that are exported from `gatsby-config` and `gatsby-node`,
    as well as any `includePlugins()` calls.
  * This is meant to contain a dynamic context; anything you may want to pass around to the various functions that
    this plugin supports.
    * This object is **mutable**, so any changes you make to it after it has been passed to a function will be
      persistent.
  * If you are using the `generateConfig()` plugin declaration, this will be represented by that function's
    second parameter:

    ```js
    // gatsby-config.js
    module.exports = generateConfig({}, { test: 1234 });
    ```

    ```ts
    // .gatsby/gatsby-config.ts
    export default ({ projectRoot }, { test }) => {
      console.log(test) // 1234
    }
    ```

---

### Determining the interpreter

> Babel takes priority, so will be the default interpreter.

1. If `babel` is a truthy value, or `tsNode` is a falsy value, then `babel` will be chosen.

2. If `babel` is a truthy value, and `tsNode` is a truthy value, then `babel` will be chosen.

3. If `babel` is a falsy value, and `tsNode` is a truthy value, then `ts-node` will be chosen.

_For the moment, there is no way to layer `ts-node` -> `babel`, but the feature may be included
   in a later release_

---

### Site Implementation

The primary purpose of this plugin is to allow you to write your `gatsby-config` and `gatsby-node`
in Typescript.  To that end, your `gatsby-config` and `gatsby-node` may follow the standard
Gatsby API pattern.

However, this plugin also supports some more advanced features that you may find useful:

* `gatsby-*` default export functions
  * You are no longer restricted to exporting a simple object from your root project's
    `gatsby-config`.  Your Typescript `gatsby-config` and `gatsby-node` may export a function
    as the default export.
  * The default export functions receive various parameters that may be useful to you.

* Property Bag
  * A mutable object that is passed around to all of the functions that this plugin supports
  * Allows you to share information between `gatsby-config` functions and `gatsby-node`.

* `includePlugins()`
  * A utility function that allows more advanced declaration of Gatsby plugins.
  * Adds support for transpiling local plugins

**For more information, see the [Gatsby API](./docs/GATSBY-API.md) chapter**

---

### Contributing / Issues

If you feel a feature is missing, or you find a bug, please feel free to file an issue
at <https://github.com/Js-Brecht/gatsby-plugin-ts-config/issues>.

I would also welcome any additions anybody would like to make.

### Donations

If you enjoyed using this plugin, and you'd like to help support its development, you're welcome to donate!

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=J3ZGS46A4C5QA&currency_code=USD&source=url)
