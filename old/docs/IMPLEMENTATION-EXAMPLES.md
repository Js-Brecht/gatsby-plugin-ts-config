## Examples

* Using types in `gatsby-config`

  _One good example is the plugin [`gatsby-plugin-pnpm`](https://github.com/Js-Brecht/gatsby-plugin-pnpm),
  since it exports the interface for the options that are valid for it.  They could be used like this:_

  _Another example would be [`gatsby-source-filesystem`](https://github.com/gatsbyjs/gatsby/blob/c1368c06fb975bd792ebb8f9d0c5a5e4ebcba388/packages/gatsby-source-filesystem/index.d.ts#L100-L103).  As you'll notice, its interface is already
  configured to use the `resolve` and `options` properties, so `IGatsbyPluginDef` wouldn't be needed._

  ```ts
  import type { IPluginOptions as IPnpmPluginOptions } from 'gatsby-plugin-pnpm';
  import type { FileSystemConfig } from 'gatsby-plugin-filesystem';
  import { ITSConfigFn, IGatsbyPluginDef, includePlugins } from 'gatsby-plugin-ts-config';

  type PluginDefs = (
    | IGatsbyPluginDef<'gatsby-plugin-pnpm', IPnpmPluginOptions>
    | FileSystemConfig
  )

  includePlugins<PluginDefs>(
    [
      {
        resolve: 'gatsby-plugin-pnpm', // <-- this will be typed
        options: {
          ... // <-- These will be typed
        }
      }
    ],

    ({ projectRoot }) => ([
      {
        resolve: 'gatsby-source-filesystem' // <-- this will be typed
        options: {
          ... // <-- These will be typed
        }
      }
    ])
  )

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