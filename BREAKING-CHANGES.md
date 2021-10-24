### Types

* `TSConfigFn` -> `ProjectMetaFn`

### Themes support

Themes are allowed to export

* `useGatsbyConfig` or `useGatsbyNode` are gone, replaced with `withMetaConfig`and
  `withMetaNode`.

  These are not required.  They just allow you to export a function from `gatsby-config` or `gatsby-node`
  that will receive the metadata `gatsby-ts` provides.

* Do not export `ProjectMetaFn` directly as default!  Use the meta function wrappers listed above.
