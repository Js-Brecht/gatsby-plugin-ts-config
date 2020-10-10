## Writing Gatsby API Endpoints

### `gatsby-browser` and `gatsby-ssr`

If these files are located in your `projectRoot`, then they will be skipped by this plugin
because Gatsby is able to process them by default, through Webpack.

### `gatsby-config` and `gatsby-node`

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

### `gatsby-*` as-a-function parameters

1. First parameter: `{object}`
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

2. Second parameter: `{object}` - The Property Bag
    * This parameter contains the object that you passed in as the `props` plugin option in the original plugin
      declaration array, or as the second parameter you passed to `generateConfig()`

    **More information can be found in the [Property Bag](./PROPERTY-BAG.md) chapter**

### `gatsby-config` utilites

1. `includePlugins`: This function allows you to register plugins with strongly typed options.  Using it
  also enables advanced plugin resolution, allowing you to automatically resolve local plugins.  Any
  plugins resolved this way will also be compiled, so if you have local plugins written in Typescript, they
  will be transpiled so that they can be consumed by Gatsby.

**Please see the [Gatsby Config Utilities](./GATSBY-CONFIG-UTILS.md) chapter for more information**

### Type utilities

A couple of utility interfaces are exported by this plugin to make it easier to create
type-safe functions in `gatsby-node` and `gatsby-config`:

* `ITSConfigFn`: Interface that describes the shape of the `gatsby-config` or `gatsby-node`
  default export functions.  Accepts two parameter:
  * The string parameter for the function type ('config' | 'node')
  * The type of the property bag, which is represented by the second parameter in the function.

  ```ts
  interface IPropertyBag {
    test: number;
  }

  export const gatsbyConfig: ITSConfigFn<"config", IPropertyBag> = (
    { projectRoot },
    { test }
  ) => {
    console.log(test);
    return {
      plugins: [
        "foo-plugin"
      ]
    }
  }

  export default gatsbyConfig;
  ```

* `IGatsbyPluginDef`: Utility type that makes it easy to merge a plugin's defined types
  into your plugins object array.  Accepts two parameters:
  * The name of the plugin, which will be used in the `resolve` property
  * The interface for the plugin's options
