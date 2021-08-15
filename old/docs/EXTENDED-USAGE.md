## Extended Usage

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