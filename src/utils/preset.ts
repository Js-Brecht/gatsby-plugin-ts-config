import path from 'path';
const r = (pkg: string): string => require.resolve(pkg);

const preset = () => {
    const nodeVersion = process.version.split('v')[1];
    const { NODE_ENV, BABEL_ENV } = process.env;

    const IS_TEST = (BABEL_ENV || NODE_ENV) === `test`;

    const nodeConfig = {
        corejs: 2,
        useBuiltIns: `entry`,
        targets: {
            node: nodeVersion,
        },
    };

    return {
        presets: [
            [
                r(`@babel/preset-env`),
                Object.assign(
                    {
                        loose: true,
                        debug: false,
                        shippedProposals: true,
                        modules: `commonjs`,
                    },
                    nodeConfig,
                ),
            ],
            r(`@babel/preset-react`),
            r(`@babel/preset-flow`),
        ],
        plugins: [
            r(`@babel/plugin-proposal-nullish-coalescing-operator`),
            r(`@babel/plugin-proposal-optional-chaining`),
            [
                r(`@babel/plugin-transform-runtime`),
                {
                    absoluteRuntime: path.dirname(require.resolve('@babel/runtime/package.json')),
                },
            ],
            r(`@babel/plugin-syntax-dynamic-import`),
            IS_TEST && r(`babel-plugin-dynamic-import-node`),
        ].filter(Boolean),
        overrides: [
            {
                test: [`**/*.ts`],
                presets: [[r(`@babel/preset-typescript`), { isTSX: false }]],
            },
            {
                test: [`**/*.tsx`],
                presets: [[r(`@babel/preset-typescript`), { isTSX: true }]],
            },
        ],
    };
};

export = preset;