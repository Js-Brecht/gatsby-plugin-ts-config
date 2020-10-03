## Property bag

The property bag is a mutable object that is passed between all of the functions that this plugin supports.

### Initial declaration of the property bag

You may declare the property bag initially in the original declaration of this plugin.  This is in the
root `gatsby-config.js`:

```js
// gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: "gatsby-plugin-ts-config",
      options: {
        props: {
          test: 1234
        }
      }
    }
  ]
}

// or
const { generateConfig } = require("gatsby-plugin-ts-config");

module.exports = generateConfig(
  // Plugin options
  {
    configDir: ".gatsby",
  },

  // Property bag
  {
    test: 1234
  }
);
```

More details about plugin declaration below.

### Receiving properties

Every function that this plugin utilizes will receive the property bag as the second parameter.  This includes:
* The `gatsby-*` default export functions

  ```ts
  // .gatsby/gatsby-config.ts
  import { ITSConfigFn } from "gatsby-plugin-ts-config";

  interface IPropBag {
    test: string;
  }

  export default ({ projectRoot }, { test }) => {
    console.log(test) // some string
    console.log(projectRoot); // The process cwd
  } as ITSConfigFn<"gatsby", IPropBag>;
  ```

* The `includePlugins()` utility function

  ```ts
  // .gatsby/gatsby-config.ts
  import { includePlugins, IGatsbyPluginDef } from "gatsby-plugin-ts-config";

  interface IPropBag {
    test: string;
  }

  includePlugins<
    // Defines a loosely typed plugin array
    IGatsbyPluginDef,
    IPropBag
  >([ /** some plugins */ ], ({ projectRoot }, { test }) => {
    console.log(test); // some string
  });
  ```

### Order of executions

Because it is mutable, it is important that you remember the order of executions:

* `gatsby-config` default export function
* `includePlugins`:
  * first parameter, if it is a function
  * second parameter
* `gatsby-node` default export function
