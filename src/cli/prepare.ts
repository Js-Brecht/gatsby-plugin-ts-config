import { apiTypeKeys, runTypeEnv, depthEnv } from "@util/constants";
import { resolveFilePath } from "@util/fs-tools";
import { getProjectPkgJson } from "@util/project-meta";
import { PluginError, getDebugLogger } from "@util/output";
import { processApiModule } from "@lib/api-module";
import { Project } from "@lib/project";

(() => {
    const runType = process.env[runTypeEnv];

    let curDepth = parseInt(process.env[depthEnv] || "1");
    if (isNaN(curDepth)) curDepth = 1;

    const skip = (
        runType === "build"
            ? curDepth > 1
            : runType === "develop"
                ? curDepth > 2
                : true
    );

    const recurse = (
        runType === "develop"
            ? curDepth > 1
            : true
    );

    // console.log("DEPTH:", process.env[depthEnv]);
    // console.log("Should skip:", skip);
    // console.log("runType:", runType, "\n\n\n");

    process.env[depthEnv] = String(curDepth + 1);

    const startDir = process.cwd();

    apiTypeKeys.some((key) => {
        const projectDetails = getProjectPkgJson(startDir);

        if (!projectDetails) {
            throw new PluginError("Unable to locate your default-site's `package.json` using your cwd");
        }

        const {
            projectRoot,
            pkgJson,
        } = projectDetails;
        const modulePath = resolveFilePath(startDir, `./gatsby-${key}`);

        if (modulePath) {
            const project = Project.getProject(
                {
                    apiType: key,
                    projectMeta: {
                        projectName: pkgJson.name || "default-site-plugin",
                        projectRoot,
                        pkgJson,
                    },
                },
                true,
                true,
                getDebugLogger(`prepare:${process.pid}:${key}`),
            );

            if (skip) {
                project.transpiler.enable();
                return true;
            }
            return processApiModule({
                init: modulePath,
                project,
                recurse,
            });
        }
    });
})();