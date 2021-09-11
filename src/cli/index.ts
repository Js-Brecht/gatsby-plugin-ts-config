import path from "path";
import { spawn } from "child_process";
import isNil from "lodash/isNil";

import resolveBin from "resolve-bin";
import { PluginError } from "@util/output";
import { parentEnv, depthEnv, runTypeEnv } from "@util/constants";

let gatsbyPath: string;
try {
    gatsbyPath = path.dirname(
        require.resolve("gatsby/package.json"),
    );
} catch (err) {
    throw new PluginError("You must have Gatsby installed to use this CLI!");
}

const gatsbyBin = resolveBin.sync(gatsbyPath, {
    executable: "gatsby",
});

const runTypes = ["build", "develop"];
const curRunType = runTypes.find((type) => (
    process.argv.some((arg) => (
        arg && arg.toLowerCase() === type
    ))
));

const cp = spawn(
    "node",
    ["-r", require.resolve("./prepare")].concat(
        gatsbyBin,
        process.argv.slice(2),
    ),
    {
        stdio: "inherit",
        cwd: process.cwd(),
        env: {
            ...process.env,
            [parentEnv]: process.pid.toString(),
            [depthEnv]: "1",
            [runTypeEnv]: curRunType,
        },
    },
);

cp.on("exit", (code, signal) => {
    if (code) {
        process.exit(code);
    }

    if (!isNil(signal)) {
        process.kill(process.pid, signal);
    }
});