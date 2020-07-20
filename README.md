## Configure Gatsby to use Typescript for configuration files

> This plugin will allow you to write your `gatsby-*` configuration files in Typescript.

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

---

### Determining the interpreter

> Babel takes priority, so will be the default interpreter.

1. If `babel` is a truthy value, or `tsNode` is a falsy value, then `babel` will be chosen.

2. If `babel` is a truthy value, and `tsNode` is a truthy value, then `babel` will be chosen.

3. If `babel` is a falsy value, and `tsNode` is a truthy value, then `ts-node` will be chosen.

_For the moment, there is no way to layer `ts-node` -> `babel`, but the feature may be included
   in a later release_

### Extended Usage

If, for some reason, you need to force this plugin to resolve files relative to a directory other than
your process current working directory, then you can define the `projectRoot` option:

```js
// gatsby-config.js
const { generateConfig } = require('gatsby-plugin-ts-config');
module.exports = generateConfig({
    projectRoot: __dirname,
});
```

When using this plugin, it is preferable to keep the configuration files out of your project root, because
this helps avoid Gatsby node ownership conflicts.

```js
// gatsby-config.js
const { generateConfig } = require('gatsby-plugin-ts-config');
module.exports = generateConfig({
    projectRoot: __dirname, // <- not required.  If omitted, projectRoot will be process.cwd()
    configDir: '.gatsby'
});
```

This will make it look in my `.gatsby` subdirectory for all configuration files.  So I might have the
following:

```text
.
├── .gatsby
    ├── gatsby-config.ts
    ├── gatsby-node.ts
    ├── gatsby-browser.ts
    └── gatsby-ssr.ts
└── gatsby-config.js
```

---

### `babel` specific usage details

#### babel Options

The babel configuration takes all of the same options you would expect
to provide to babel itself.  For specific details, please see the
[babel options documentation](https://babeljs.io/docs/en/options#config-loading-options)

Options that you give to this plugin for babel to use will not interfere with
the options that you give to Gatsby.  However, it's important to keep in mind
that they **will** mix with the options that you put in a `.babelrc` in your
project root.

#### `babel` example usage

Following is an example setup that will configure babel to be able to use the
aliases defined in `tsconfig.compilerOptions.paths`.

```js
// gatsby-config.js
const { generateConfig } = require('gatsby-plugin-ts-config');

const path = require('path');
const tsconfig = require('./tsconfig.json');
const moduleResolverOpts = {};
if (tsconfig && tsconfig.compilerOptions) {
  if (tsconfig.compilerOptions.baseUrl)
    moduleResolverOpts.root = [path.resolve(__dirname, tsconfig.compilerOptions.baseUrl)];
  if (tsconfig.compilerOptions.paths)
    moduleResolverOpts.alias = Object.entries(tsconfig.compilerOptions.paths).reduce((acc, [key, val]) => {
      acc[key.replace(/\/\*$/, '')] = val[0].replace(/\/\*$/, '');
      return acc;
    }, {});
}

module.exports = generateConfig({
  configDir: '.gatsby',
  babel: {
    plugins: [
      [
        require.resolve('babel-plugin-module-resolver'),
        moduleResolverOpts,
      ],
    ],
  },
});
```

---

### `ts-node` specific usage details

#### `ts-node` Options

For valid options you may use to configure `ts-node`, see the [ts-node
options documentation here](https://github.com/TypeStrong/ts-node#cli-and-programmatic-options)

#### tsconfig.json

By default, `gatsby-plugin-ts-config` will make `ts-node` use the `tsconfig.json` found in the
`projectRoot`.  If you want to define a different one, include it as one of the `tsNode` options:

```js
// gatsby-config.js
const { generateConfig } = require('gatsby-plugin-ts-config');
module.exports = generateConfig({
  tsNode: {
    project: 'tsconfig.build.json'
  },
});
```

Note: if you define this file, it will be resolved relative to the defined `projectRoot` (which is your
`process.cwd()` by default), unless it is an absolute path.

#### `ts-node` example usage

Following is an example of `ts-node` usage that will configure a custom paths transformer for `ts-node`,
enabling the usage of `tsconfig.compilerOptions.paths` in your Typescript code:

```js
// gatsby-config.js
const TsPathsTransformer = require('@zerollup/ts-transform-paths');
const { generateConfig } = require('gatsby-plugin-ts-config');
module.exports = generateConfig({
  projectRoot: __dirname,
  configDir: '.gatsby',
  tsNode: {
    transformers: (program) => {
      const tsTransformPaths = TsPathsTransformer(program);
      return {
        before: [
          tsTransformPaths.before,
        ],
        afterDeclarations: [
          tsTransformPaths.afterDeclarations,
        ],
      };
    },
  },
});
```

---

### Writing Gatsby API Endpoints

#### `gatsby-browser` and `gatsby-ssr`

If these files are located in your `projectRoot`, then they will be skipped by this plugin
because Gatsby is able to process them by default, through Webpack.

#### `gatsby-config` and `gatsby-node`

These files can be created two ways.

1. The first is by exporting a single object or series of
named exports, the same way you normally would.

    * You may also export this object as the _**default export**_, if you
      wish.  It is supported by this plugin, and it has better support in
      Typescript itself.

    ```ts
    // gatsby-config.ts
    export default {
      siteMetadata: {
        siteUrl: "https://foobar.com",
      },
      plugins: [
        ...
      ]
    }
    ```

2. The second method allows you to export a single function as the default export.  This function
will receive a single object as the first and only parameter.  The object properties are
defined below

#### `gatsby-*` as-a-function parameters

* `projectRoot`: `{string}`
  * The resolved pathname that you either defined in the plugin options, or that was calculated
    automatically.

* `configDir`: `{string}`
  * The location of your configuration files.  If you do not define one in the plugin options, then
    this will be the same as your `projectRoot`.

* `cacheDir`: `{string}`
  * The cache folder location that the plugin will use to store any of the files that it needs to.
* `endpoints`: `{object}`
  * A collection of the fully qualified paths for all of the Gatsby configuration files that have been
    resolved, and that will be called, by this plugin.  This will be equal to any of the endpoints that
    you have in your `configDir`, with one exception:
    * If your `configDir` is the same as the `projectRoot`, then `gatsby-ssr` and `gastby-browser` will
      **not** be included in these resolved endpoints, because they will not be called by this plugin.
  * Properties:
    * config: `{string[]}` - The list of chained requires/imports that were performed by `gatsby-config`
    * node: `{string[]}` - The list of chained requires/imports that were performed by `gatsby-node`
    * browser: `{string[]}` - The resolved path of the `gatsby-browser` api endpoint
    * ssr: `{string[]}` - The resolved path of the `gatsby-ssr` api endpoint
    * plugin - Contains the collection of all the plugins that have been resolved by the `includePlugins()` function,
      defined below.  `name` will be the registered name of the plugin, and the `config`, `node`, `browser`,
      and `ssr` properties will be the same as defined above.
      * Type:

      ```js
      {
        [name: string]: {
          config: string[];
          node: string[];
          browser: string[];
          ssr: string[];
        }
      }
      ```

  * If the `browser` or `ssr` properties are included, they will only have one index, containing the
    location of the endpoint that was resolved.  This is because transpiling & compiling of those modules
    is done by Gatsby itself, not this module.
  * The first index of each property will always be your local Gatsby endpoint.  All following indexes will be
    the files that were required/imported by that one



#### `gatsby-config` utilites

1. `includePlugins`: This function allows you to register plugins with strongly typed options.  Using it
  also enables advanced plugin resolution, allowing you to automatically resolve local plugins.  Any
  plugins resolved this way will also be compiled, so if you have local plugins written in Typescript, they
  will be transpiled so that they can be consumed by Gatsby.

    * There are few overloads for this function.

      1. You may include an array of plugins in the first parameter, which takes the same shape as Gatsby's
         plugin array.
          * You may optionally include a **callback function** in the second parameter.  It will receive all of the
            same parameters defined above for the `gatsby-*` as-a-function.  It must return an array in the same
            shape as Gatsby's plugin array.

      2. Or, you may include only the **callback function** in the first parameter.

    * Any plugins defined in the array in the first parameter will be resolved before the normal Gatsby plugin
      array is processed.  This means that any plugins resolved this way will be available to the normal
      function export.

    * Any callback functions defined this way will be called, in sequence, after the normal Gatsby array has
      been processed.  This means that all of the plugins from the previously defined array(s), and the normal
      Gatsby array will be available in the callback's parameters.

    * The ordering of the plugins will be the same as the order they are resolved.

      1. Arrays resolved by this function
      2. Standard Gatsby array
      3. Callback function arrays

#### Type utilities

A couple of utility interfaces are exported by this plugin to make it easier to create
type-safe functions in `gatsby-node` and `gatsby-config`:

* `ITSConfigFn`: Interface that describes the shape of the `gatsby-config` or `gatsby-node`
  default function exports.  Accepts one parameter:
  * The string parameter for the function type ('config' | 'node')

* `IGatsbyPluginDef`: Utility type that makes it easy to merge a plugin's defined types
  into your plugins object array.  Accepts two parameters:
  * The name of the plugin, which will be used in the `resolve` property
  * The interface for the plugin's options

#### Examples

* Using types in `gatsby-config`

  _One good example is the plugin [`gatsby-plugin-pnpm`](https://github.com/Js-Brecht/gatsby-plugin-pnpm),
  since it exports the interface for the options that are valid for it.  They could be used like this:_

  _Another example would be [`gatsby-source-filesystem`](https://github.com/gatsbyjs/gatsby/blob/c1368c06fb975bd792ebb8f9d0c5a5e4ebcba388/packages/gatsby-source-filesystem/index.d.ts#L100-L103).  As you'll notice, its interface is already
  configured to use the `resolve` and `options` properties, so `IGatsbyPluginDef` wouldn't be needed._

  ```ts
  import type { IPluginOptions as IPnpmPluginOptions } from 'gatsby-plugin-pnpm';
  import type { FileSystemConfig } from 'gatsby-plugin-filesystem';
  import { ITSConfigFn, IGatsbyPluginDef, includePlugins } from 'gatsby-plugin-ts-config';

  includePlugins<
    | IGatsbyPluginDef<'gatsby-plugin-pnpm', IPnpmPluginOptions>
    | FileSystemConfig
  >([
    {
      resolve: 'gatsby-plugin-pnpm', // <-- this will be typed
      options: {
        ... // <-- These will be typed
      }
    }
  ], ({
    projectRoot,
  }) => ([
    {
      resolve: 'gatsby-source-filesystem' // <-- this will be typed
      options: {
        ... // <-- These will be typed
      }
    }
  ]))

  // If you want to define a plugin that will receive the previous callback's
  // resolved plugins (gatsby-source-filesystem), then you can call the function
  // again

  includePlugins<
    | IGatsbyPluginDef<'foo-plugin-that-receives-filesystem-endpoints', IFooPluginOptions>
  >(({
    endpoints,
  }) => ([
    {
      resolve: 'foo-plugin-....',
      options: {
        pluginPaths: endpoints.plugin['gatsby-source-filesystem'].node,
      }
    }
  ]))

  const gatsbyConfig: ITSConfigFn<'config'> = ({
    projectRoot
  }) => ({
    siteMetadata: {
      title: `Some site title`,
      description: `This is a description of your site`,
      author: `@Js-Brecht`,
    },
    plugins: [
      {
        // All of your normal, untyped Gatsby plugins
      }
    ]
  });

  export default gatsbyConfig;
  ```

* Something similar can be done for `gatsby-node`, but it is even simpler:

  ```ts
  import { SourceNodesArgs } from 'gatsby';
  import { ITSConfigFn } from 'gatsby-plugin-ts-config';

  const gatsbyNode: ITSConfigFn<'node'> = ({
    projectRoot
  }) => ({
    sourceNodes: async ({
      actions,
      createNodeId,
      createContentDigest
    }: SourceNodesArgs): Promise<void> => {
      const { createNode } = actions;
      /* Create your nodes here */
      return;
    }
  })

  export default gatsbyNode;
  ```

---

### Contributing / Issues

If you feel a feature is missing, or you find a bug, please feel free to file an issue
at <https://github.com/Js-Brecht/gatsby-plugin-ts-config/issues>.

I would also welcome any additions anybody would like to make.

### Donations

If you enjoyed using this plugin, and you'd like to help support its development, you're welcome to donate!

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=J3ZGS46A4C5QA&currency_code=USD&source=url)
