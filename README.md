[babel-docs]: https://babeljs.io/docs/en/options#config-loading-options
[tsnode-docs]: https://github.com/TypeStrong/ts-node#cli-and-programmatic-options
[hooks]: #hooks
[meta-fn]: #meta-functions
[load-plugins]: #generating-plugin-arrays

## Configure Gatsby to use Typescript for configuration files

[![paypal](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=J3ZGS46A4C5QA&currency_code=USD&source=url)

> This plugin will allow you to write your `gatsby-*` configuration files in Typescript.

---

### Installation

* Install using your package manager

  ```shell
  npm install gatsby-ts
  ```

* Use `gatsby-ts` in place of `gatsby`

  _package.json_

  ```json
  {
    "scripts": {
      "build": "gatsby-ts build",
      "develop": "gatsby-ts develop"
    }
  }
  ```

  > All of the flags & options provided to `gatsby-ts` will be passed through to `gatsby`.

* Write your `gatsby-config` and `gatsby-node` in Typescript

### Usage

You may write your `gatsby-config` and `gatsby-node` files how you would normally, except you will be
writing them in Typescript.

Some examples:

```js
// .gatsby-ts.js
const { createOptions } = require("gatsby-ts");

module.exports = createOptions({
  type: "babel",
  props: {
    test: "Hello",
  },
});
```

```ts
// gatsby-config.ts
import { loadPluginsDeferred, withMetaConfig, GatsbyPlugin } from "gatsby-ts";
import type { PluginOptions as ITypegenPluginOptions } from 'gatsby-plugin-typegen/types';
import type { IPluginOptions as IPnpmPluginOptions } from 'gatsby-plugin-pnpm';
import type { FileSystemConfig } from 'gatsby-source-filesystem';

type PluginDefs = (
  | GatsbyPlugin<'gatsby-plugin-typegen', ITypegenPluginOptions>
  | GatsbyPlugin<'gatsby-plugin-pnpm', IPnpmPluginOptions>
  | FileSystemConfig
)

type PropertyBag = {
  test: string;
}

loadPluginsDeferred<
  PluginDefs,
  PropertyBag
>(() => ([
  {
    resolve: `gatsby-plugin-typegen`,
    options: {
      // These options will be typed
    },
  },
]));

export default withMetaConfig(({ loadPlugins }, props) => {
  console.log(props.test) // Hello
  props.test += " world"


  const plugins = loadPlugins<PluginDefs, PropertyBag>([
    // All of these will be typed
    {
      resolve: `gatsby-plugin-pnpm`,
      options: {
        strict: true,
        projectPath: __dirname,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
  ]);

  return {
    siteMetadata: {
      title: "Foo site",
    },
    plugins: [
      ...plugins,

      // These are not typed
      {
        resolve: "foo-plugin"
      }
    ]
  }
})
```

```ts
// gatsby-node.ts
import { withMetaNode } from "gatsby-ts";

/**
 * Can easily do this the normal way
 *
 * import { GatsbyNode } from "gatsby";
 *
 * export const sourceNodes: GatsbyNode["sourceNodes"] = ({ actions }) => {
 *   // do something
 * }
 */

export default withMetaNode((args, props) => {
  console.log(props.test) // Hello world

  return {
    sourceNodes: async ({
      actions,
    }): Promise<void> => {
      /**
       * Create your nodes here
       */

      console.log("Hello from sourceNodes!!\n\n\n");
      return;
    },

    onCreateWebpackConfig: ({
      actions,
      getConfig,
    }) => {
      const config = getConfig();
      // Do something with the config
    },
  };
});
```

#### Debugging

The [official guide for debugging](https://www.gatsbyjs.com/docs/debugging-the-build-process) applies. Don't forget to adjust the `launch.json` configuration to use the `gatsby-ts` executable, when debugging with Visual Studio Code:

```
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Gatsby develop",
      "type": "pwa-node",
      "request": "launch",
      "program": "${workspaceRoot}/node_modules/.bin/gatsby-ts",
      "args": ["develop"],
      "runtimeArgs": ["--nolazy"],
      "console": "integratedTerminal"
    },
    {
      "name": "Gatsby build",
      "type": "pwa-node",
      "request": "launch",
      "program": "${workspaceRoot}/node_modules/.bin/gatsby-ts",
      "args": ["build"],
      "runtimeArgs": ["--nolazy"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Configuration

Each project that employs this utility may define their own configurations.  This primarily serves the
purpose of configuring what transpiler to use and _its_ options, but also allows you to define a "property
bag" that will be passed around to the [meta functions][meta-fn] described later.

* Create the file `.gatsby-ts.js` in the root of the project using this utiltiy.

  ```js
  // This function will give you intellisense for the object structure
  const { createOptions } = require("gatsby-ts");

  module.exports = createOptions({
    type: "babel", // | "ts-node"
    transpilerOptions: {
      // ... any transpiler options applicable to the chosen transpiler
    },
    props: {
      // ... Put any object you wish here.  It will be passed around to gatsby-ts meta functions
    }
  })
  ```

#### Option Descriptions

1. `type`: `"babel" | "ts-node"`
    * Tells `gatsby-ts` what transpiler to use.  For `ts-node`, `typescript` **_must_** be installed.

2. `transpilerOptions`: `Object`
    * If you chose `babel` as your `type`, see the [babel docs][babel-docs] for configuration details
    * if you chose `ts-node` as your `type`, see the [ts-node docs][tsnode-docs] for configuration details

3. `props`: `Object`
    * This can be any object you choose.  It will be passed around as-is to each "meta" function that you
      define.  Any of those functions may mutate the `props`, and the affect will be passed along.

4. `hooks`: `HooksObject`
    * See [Hooks][hooks] for more details

### Property Bag

This object may take any shape you want, and serve any purpose you want.  It is completely free-form.
`gatsby-ts` itself doesn't care about it at all, and its sole purpose is to pass around values that you wish
between `gatsby-config`, and `gatsby-node`.

A couple of notes regarding the property bag:

* One will be passed to the [meta functions][meta-fn] whether or not you define it in `.gatsby-ts.js`

* The property bag is mutable, so you may make changes to it in one function, and those changes will be
  passed over to the other.

* When calling local plugins (ones you have designed yourself inside of the `/plugins` folder), the property
  bag for the current project will be **_copied_** and passed to them.

### Hooks

You may hook into some of the internal processes of `gatsby-ts` by defining the `hooks` property on
your configuration object.

Hooks that are available:

1. `ignore`: `Array<(filename: string, original: boolean) => boolean | void>`
    * This hook allows you to define an array of functions that will be treated as ignore rules for the
      transpiler.  The file currently being processed will be passed in the first parameter, and whatever
      ignore value `gatsby-ts` would have used originally will be the second parameter.

    * The first function to return `true` (or a truthy value) will cause the file to be ignored.

### "Meta" Functions

These are functions that receive certain meta values / utilities from `gatsby-ts`.  Their use is completely
optional, but may be useful in certain situations.  They receive in their parameters certain details about
the project that's currently being transpiled, certain utility functions, as well as the "Property Bag" that
gets passed around to all of the "Meta" functions for the current project.

The function you'll use
depends on the file you are setting up:

|API Type|Meta Function Factory|
|--------|---------------------|
|`gatsby-config`|`withMetaConfig()`|
|`gatsby-node`|`withMetaNode()`|

Each meta function factory takes a single callback:

```ts
type MetaCb = (args: MetaCbArgs, props: PropertyBag) => GatsbyConfig | GatsbyNode
```

#### `MetaCbArgs`: `Object`

##### Common Properties

* `projectRoot`: The absolute path to the current project.
* `imports`: All of the imports used by your `gatsby-*` modules.
  * This is structured by API Type, and then by plugin + API Type
    * `config`: `string[]`
    * `node`: `string[]`
    * `plugins`: `Object`
      * `[pluginName: string]`: `Object`
        * `config`: `string[]`
        * `node`: `string[]`

**`withMetaConfig()` Properties**

* `loadPlugins`: `(input: GatsbyPlugin[] | MetaCb) => GatsbyPlugin[]`
  * Use this function to generate a strongly typed array of gatsby plugin definitions.

    It has a generic type parameter that you can use to define a union of accepted gatsby plugins & options.
    This allows you to restrict the plugin definitions the types that are (hopefully) published by each
    plugin.

  * See more details in [Generating plugin arrays][load-plugins] (For details about this
    function specifically, see [this section](#loadplugins))

### Generating plugin arrays

It may be desirable to apply types to the plugin array that you define for Gatsby's consumption.  Some plugins
already publish types for their configurations, so `gatsby-ts` provides a method to make appyling those types easier.

There are two APIs to facilitate this:

* `loadPluginsDeferred`
* `loadPlugins`

These functions accept callbacks that behave exactly the same as the `ProjectMetaCb` described
[earlier][meta-fn]

#### Generic Type Parameters

Each of these APIs can be used with two generic type parameters,

* `PluginDefinitions` - Should be a union of various plugin declaration types, in the format:

  ```ts
  type PluginDef = string | {
    resolve: string;
    options: Record<string, any> | PluginOptions
  }
  ```

  To make this easy, `gatsby-ts` provides a type utility called `GatsbyPlugin`.

  ```ts
  import { GatsbyPlugin } from "gatsby-ts";

  type PluginDefs = (
    | GatsbyPlugin<"gatsby-source-filesystem", {
      // Options
    }>
    | GatsbyPlugins<"foo-plugin", {
      // Options
    }>
  );
  ```

* `PropertyBag` - Defines the structure of the property bag passed to the
  callback.

#### `loadPluginsDeferred`

Plugins defined with this API will not be included until all of the current project's
modules are completed processing.  The reason for this is that the various properties passed
to the callback are updated as the project is processed, so deferring the loading of the
plugins until the end ensures that they get the most up to date information.

Loading plugins this way causes them to be appended to the end of the plugin array that
is passed to Gatsby.

```ts
import { loadPluginsDeferred, GatsbyPlugin } from "gatsby-ts";

type PluginDefinitions = (
  | GatsbyPlugin<'foo', IFooPluginOptions>
  | 'bar'
  | { resolve: 'bar'; options: { qux: number }; }
)

type PropertyBag = {
  random: string;
  properties: number[];
}

loadPluginsDeferred<PluginDefinitions, PropertyBag>(
  ({ projectRoot, imports }, {random, properties}) => {
    // Build plugin array
  })
);
```

#### `loadPlugins`

This function is passed to [`ProjectMetaCb` functions][meta-fn] `withMetaConfig`.  It accepts
either an array of plugins, or its own `ProjectMetaCb`.  This array/cb will be processed
immediately.

You may use the same generic type parameters for this function as well:

```ts
import { withMetaConfig, GatsbyPlugin } from "gatsby-ts";

type PluginDefinitions = (
  | GatsbyPlugin<'foo', IFooPluginOptions>
  | GatsbyPlugin<"bar", { qux: number }>
  | "baz"
)

type PropertyBag = {
  random: string;
  properties: number[];
}

export default withMetaConfig(({ loadPlugins }, { random, properties }) => {

  const plugins = loadPlugins<PluginDefinitions, PropertyBag>([
    {
      resolve: "foo",
      options: { ...opts }
    },
    {
      resolve: "bar",
      options: { qux: 1234 }
    },
    "baz" // Or `{ resolve: "baz" }` but there's no options
  ])

  return {
    plugins,
  }

})
```

### Contributing / Issues

If you feel a feature is missing, or you find a bug, please feel free to file an issue
at <https://github.com/Js-Brecht/gatsby-plugin-ts-config/issues>.

I would also welcome any additions anybody would like to make.

### Donations

If you enjoyed using this plugin, and you'd like to help support its development, you're welcome to donate!

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=J3ZGS46A4C5QA&currency_code=USD&source=url)
