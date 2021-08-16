import path from "path";
import resolveBin from "resolve-bin";
import { createRequire } from "./util/node";
import { resolveFilePath } from "./util/fs-tools";
import { getProjectPkgJson } from "./util/project";
import { apiTypeKeys } from "./util/constants";
import { processApiModule } from "./lib/api-module";
import { getTranspiler } from "./lib/transpiler";

import type { TsConfigPluginOptions } from "./types";

const getGatsbyDir = () => {
    const rootRequire = createRequire(`${process.cwd()}/:internal:`);
    try {
        return path.dirname(
            rootRequire.resolve("gatsby/package.json"),
        );
    } catch (err) {
        throw new Error("You must have Gatsby installed to use this app!");
    }
};

interface IGetBinOptions {
    executable: string;
}

const getBin = (path: string, opts: IGetBinOptions): Promise<string> => {
    return new Promise((resolve, reject) => {
        resolveBin(path, opts, (err, found) => {
            if (err) return reject(err);
            resolve(found);
        });
    });
};

(async () => {
    const gatsbyBin = await getBin(
        getGatsbyDir(),
        { executable: "gatsby" },
    );

    const [projectRoot, pkgJson] = getProjectPkgJson(process.cwd()) || [];
    const projectName = pkgJson?.name;

    if (!projectRoot || !projectName) {
        throw new Error([
            "Unable to locate your project root directory",
            "and/or unable to derive your project name from your package.json",
        ].join(" "));
    }

    const options: TsConfigPluginOptions = {
        type: "babel",
        props: {},
    };

    const transpiler = getTranspiler(projectRoot, options);

    for (const api of apiTypeKeys) {
        const modulePath = await resolveFilePath(projectRoot, `./gatsby-${api}`);
        if (modulePath) {
            processApiModule({
                apiType: api,
                init: modulePath,
                propBag: options.props,
                projectName,
                projectRoot,
                options,
                transpiler,
            });
            break;
        }
    }

    return require(gatsbyBin);
})();