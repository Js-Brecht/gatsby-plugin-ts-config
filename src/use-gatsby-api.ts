// import { PluginError, getDebugLogger } from "@util/output";
// import { processApiModule } from "@lib/api-module";

// import { Project } from "@lib/project";

// import type {
//     InitValue,
//     ApiType,
//     // TsConfigPluginOptions,
//     PluginModule,
// } from "@typeDefs/internal";

// type UsePluginModule<T extends ApiType> = (
//     init: InitValue<T>,
//     // options?: TsConfigPluginOptions,
// ) => PluginModule<T>

// export const useGatsbyPluginModule = <T extends ApiType>(
//     apiType: T,
//     init: InitValue,
//     // options = {} as TsConfigPluginOptions,
// ): PluginModule<ApiType> => {
//     const debug = getDebugLogger(`useGatsbyPlugin:${apiType}`);
//     const project = Project.getProject(
//         {
//             apiType,
//             // options,
//             // propBag: options.props,
//         },
//         true,
//         true,
//         debug,
//     );

//     try {
//         return processApiModule({
//             init,
//             project,
//         });
//     } catch (err: any) {
//         throw new PluginError(err);
//     }
// };


// /**
//  * Imports/processes a `gatsby-config` module, and returns results to Gatsby
//  *
//  * @remarks
//  *
//  * - When used alone, this will support a `gatsby-config.ts` in your
//  *   project's root directory.
//  *
//  * - The `propBag` will the shared between `useGatsbyConfig` and `useGatsbyNode`,
//  *   and can be mutated by either.  After processing `gatsby-config` & `gatsby-node`
//  *   your project's local plugins will be transpiled as well, and a copy of this
//  *   `propBag` will be passed to each.
//  *
//  * @param {InitValue} initValue
//  * - Can be a string, pointing to a `gatsby-config.ts` file.  Can be relative
//  *   or absolute.  When relative, it is relative to your project's `package.json`
//  *
//  * - Can be a callback function, which can either `require()` another module
//  *   (causing it to be transpiled; default exports supported), or directly return
//  *   the object needed to return to Gatsby.
//  *
//  * @param {TsConfigPluginOptions} options - The collection of options to use
//  * throughout this instance.  These options will be shared with `useGatsbyNode` for
//  * the current project or local plugin.
//  */
// export const useGatsbyConfig: UsePluginModule<"config"> = (...args) => (
//     useGatsbyPluginModule("config", ...args) as PluginModule<"config">
// );

// /**
//  * Imports/processes a `gatsby-node` module, and returns results to Gatsby
//  *
//  * @remarks
//  *
//  * - When used without `useGatsbyConfig`, your project's local plugins
//  *   will not be transpiled.
//  *
//  * @param {InitValue} initValue -
//  * - Can be a string, pointing to a `gatsby-node.ts` file.  Can be relative
//  *   or absolute.  When relative, it is relative to your project's `package.json`
//  *
//  * - Can be a callback function, which can either `require()` another module
//  *   (causing it to be transpiled; default exports supported), or directly return
//  *   the object needed to return to Gatsby.
//  *
//  * @param {TsConfigPluginOptions} options - The collection of options to use
//  * throughout this instance.  The same options defined in `useGatsbyConfig` will
//  * be passed to `useGatsbyNode`, and additional options defined here will extend them.
//  */
// export const useGatsbyNode: UsePluginModule<"node"> = (...args) => (
//     useGatsbyPluginModule("node", ...args) as PluginModule<"node">
// );