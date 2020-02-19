## `gatsby-plugin-ts-config`

### Configure Gatsby to use Typescript for configuration files

This plugin will set up `ts-node` to be used for interpreting Gatsby configuration files
that are written in Typescript. (i.e. `gatsby-*` files)

---

### Installation

* Install via your project manager

```shell
npm install -D gatsby-plugin-ts-config
```

---

### Usage

You will still need to define, at minimum, one `.js` Gatsby configuration, `gatsby-config.js`,
and it needs to be in the root of your project, as usual.  You will then use _**it**_ to call this
plugin, and the rest of your configuration will be in Typescript files.

* The easy way

  * You can use the `generateConfig` utility that is exported by `gatsby-plugin-ts-config` to set up the
plugin array the way it needs to be.

  * Doing it this way allows your IDE to read the type interface for the options, so you can use intellisense
  while defining the plugin options.

```js
// ./gatsby-config.js
const { generateConfig } = require('gatsby-plugin-ts-config');
module.exports = generateConfig();
```

* The common way

  * _This can also be done the normal way.  The utility above just makes it easy_

```js
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

See below for additional options and extended usage.

---

### Options

|Name|Default|Description|
|:---|:------|:----------|
|**`projectRoot`**|`process.cwd()`|This defines your project's root directory for the plugin.  All folder/file resolutions will be performed relative to this directory.|
|**`configDir`**|`process.cwd()`|You can define a folder, relative to `projectRoot`, that will store your Typescript configuration files, if you want.  If you do not define this option, then it will automatically use `projectRoot`.|
|**`ignore`**|`[]`|Configuration files you don't want to be processed by this plugin.  Must be one of `ssr`, `browser`, `config`, or `node`.|
|**`tsNode`**|`{}`|These are options that will be passed to `ts-node`'s `register()` utility.  Valid options can be found [here](https://github.com/TypeStrong/ts-node#cli-and-programmatic-options)|

---

### tsconfig.json

By default, `gatsby-plugin-ts-config` will make `ts-node` use the `tsconfig.json` found in the `projectRoot`.  If you want to define a different one, include it as one of the `tsNode` options:

```js
const { generateConfig } = require('gatsby-plugin-ts-config');
module.exports = generateConfig({
    tsNode: {
        project: 'tsconfig.build.json'
    },
});
```

Note: if you define this file, it will be resolved relative to the defined `projectRoot` (which is your `process.cwd()` by default), unless it is an absolute path.

### `gatsby-browser` and `gatsby-ssr`

If these files are located in your `projectRoot`, then they will be skipped by this plugin automatically, because Gatsby is able to process them by default, via Webpack.

### Extended Usage

If, for some reason, you need to force this plugin to resolve files relative to a different directory than your process' current working directory, then you can define the `projectRoot` option:

```js
const { generateConfig } = require('gatsby-plugin-ts-config');
module.exports = generateConfig({
    projectRoot: __dirname,
});
```

I prefer to keep my configuration files out of my project root, so I usually define a subdirectory:

```js
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

### Contributing / Issues

If you feel a feature is missing, or you find a bug, please feel free to file an issue at <https://github.com/Js-Brecht/gatsby-plugin-ts-config/issues>.

I would also welcome any additions anybody would like to make.
