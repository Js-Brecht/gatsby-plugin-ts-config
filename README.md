## Configure Gatsby to use Typescript for configuration files

This plugin will allow you to write your `gatsby-*` configuration files in Typescript.

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
It also needs to be in the root of your project, as usual.  You will then use _**it**_ to call
this plugin, and the rest of your configuration will be in Typescript files.

* The easy way

  * You can use the `generateConfig` utility that is exported by `gatsby-plugin-ts-config` to set up the
plugin array the way it needs to be.

  * Doing it this way allows your IDE to read the type interface for the options, so you can use intellisense
  while defining the plugin options.

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

|Name|Default|Description|
|:---|:------|:----------|
|**`projectRoot`**|`process.cwd()`|This defines your project's root directory for the plugin.  All folder/file resolutions will be performed relative to this directory.|
|**`configDir`**|`process.cwd()`|You can define a folder, relative to `projectRoot`, that will store your Typescript configuration files, if you want.  If you do not define this option, then it will automatically use `projectRoot`.|
|**`tsNode`**|`{}`|These are options that will be passed to `ts-node`'s `register()` utility.  Valid options can be found [here](https://github.com/TypeStrong/ts-node#cli-and-programmatic-options)|

---

### tsconfig.json

By default, `gatsby-plugin-ts-config` will make `ts-node` use the `tsconfig.json` found in the `projectRoot`.  If you want to define a different one, include it as one of the `tsNode` options:

```js
// gatsby-config.js
const { generateConfig } = require('gatsby-plugin-ts-config');
module.exports = generateConfig({
    tsNode: {
        project: 'tsconfig.build.json'
    },
});
```

Note: if you define this file, it will be resolved relative to the defined `projectRoot` (which is your `process.cwd()` by default), unless it is an absolute path.

### Extended Usage

If, for some reason, you need to force this plugin to resolve files relative to a different directory than your process' current working directory, then you can define the `projectRoot` option:

```js
// gatsby-config.js
const { generateConfig } = require('gatsby-plugin-ts-config');
module.exports = generateConfig({
    projectRoot: __dirname,
});
```

I prefer to keep my configuration files out of my project root, so I usually define a subdirectory:

> It is recommended that you define a `configDir`.

```js
// gatsby-config.js
const { generateConfig } = require('gatsby-plugin-ts-config');
module.exports = generateConfig({
    projectRoot: __dirname,
    configDir: '.gatsby'
});
```

This will make it look in my `.gatsby` subdirectory for all configuration files.  So I might have the following:

```text
.
├── .gatsby
    ├── gatsby-config.ts
    ├── gatsby-node.ts
    ├── gatsby-browser.ts
    └── gatsby-ssr.ts
└── gatsby-config.js
```

I also like to use aliases in my Typescript, so I prefer to configure a custom paths transformer for `ts-node`:

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

  These files can be created two ways.  The first is by exporting a single object or series of
  named exports, the same way you normally would.  You may also export this object as the default
  export, if you wish.  It is supported.

  The second method allows you to export a single function as the default export.  This function
  will receive a single object as the first and only parameter.  The object properties are
  defined as follows:

  |Property|Description|
  |:------|:----------|
  |`projectRoot`|<p>The resolved pathname that you either defined in the plugin options, or that was calculated automatically.</p>|
  |`configDir`|<p>The location of your configuration files.  If you do not define one in the plugin options, then this will be the same as your `projectRoot`.</p>|
  |`cacheDir`|<p>The cache folder location that the plugin will use to store any of the files that it needs to.</p>|
  |`endpoints`|<p>A collection of the fully qualified paths for all of the Gatsby configuration files that have been resolved, and that will be called, by this plugin.  This will be equal to any of the endpoints that you have in your `configDir`, with two exceptions:<p> If your `configDir` is the same as the `projectRoot`, then `gatsby-ssr` and `gastby-browser` will **not** be included in these resolved endpoints, because they will not be called by this plugin.

  A couple of utility interfaces are exported by this plugin to make it easier to create
  type-safe functions in `gatsby-node` and `gatsby-config`:

  * `ITSConfigFn`: Interface that describes the shape of the `gatsby-config` or `gatsby-node`
    default function exports.  Accepts two parameters:
    * The string parameter for the function type ('config' | 'node')
    * In the case of 'config', a union of plugin option interfaces, to allow you to design a
      strongly typed object export.
  * `IMergePluginOptions`: Utility type that makes it easy to merge a plugin's defined types
    into your plugins object array.  Accepts two parameters:
    * The name of the plugin, which will be used in the `resolve` property
    * The interface for the plugin's options

  For example, the plugin [`gatsby-plugin-pnpm`](https://github.com/Js-Brecht/gatsby-plugin-pnpm) exports the interface for the options that are valid for it, and
  they could be used like this:

  ```ts
  import { IPluginOptions as IPnpmPluginOptions } from 'gatsby-plugin-pnpm';
  import { ITSConfigFn, IMergePluginOptions } from 'gatsby-plugin-ts-config';

  const gatsbyConfig: ITSConfigFn<'config',
    | IMergePluginOptions<'gatsby-plugin-pnpm', IPnpmPluginOptions>
    | /* Add more merged types here */
  > = ({
    projectRoot
  }) => ({
    siteMetadata: {
      title: `Some site title`,
      description: `This is a description of your site`,
      author: `@Js-Brecht`,
    },
    plugins: [
      {
        resolve: `gatsby-plugin-pnpm`, // <-- This will have intellisense
        options: { // <-- These will have intellisense, and will be type-checked
          projectPath: projectRoot
        }
      }
    ]
  });

  export default gatsbyConfig;
  ```

  Something similar can be done for `gatsby-node`, but it is even simpler:

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

If you feel a feature is missing, or you find a bug, please feel free to file an issue at <https://github.com/Js-Brecht/gatsby-plugin-ts-config/issues>.

I would also welcome any additions anybody would like to make.
