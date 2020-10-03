## Gatsby Config Utilities

[includePlugins]: #includeplugins

1. [includePlugins()][includePlugins]

### `includePlugins()`

This utility function will allow you to declare Gatsby plugins using a more robust
process.

Because your Gatsby plugins are essentially being declared by this plugin, Gatsby
won't be able to resolve any local plugins (using the `/plugins` directory).  This function
will allow you to resolve use those plugins.

Because some local plugins may be written in Typescript, too, this function will transpile
them before passing them on to Gatsby.

#### Function Technical Details

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

#### Callback Function Parameter

* Callback functions defined for use by the `includePlugins()` utility will receive the same parameters
  as the [`gatsby-*` default export functions](#gatsby--as-a-function-parameters) do.

#### Generic Type Parameters

  1. A union of the potential plugins (and their options).  Structuring these options is made easier
      by the type utility, `IGatsbyPluginDef`.
      * The default value of this parameter represents a loosely typed plugin array, which is essentially
        the same as `IGatsbyPluginDef` without any of its type parameters.

  2. The object type of the property bag that was defined in the `props` plugin option, or the second
      parameter passed to the `generateConfig()` function.

      ```js
      // Defaults
      import { IGatsbyPluginDef } from "gatsby-plugin-ts-config";

      includePlugins<IGatsbyPluginDef, Record<string, any>>
      ```