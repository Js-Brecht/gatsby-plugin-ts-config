import * as path from 'path';
import { register } from 'ts-node';
import { IRegisterOptions, IRegisterType, ICommonDirectories } from '../types';

export type IRegistrarProgramOpts = ICommonDirectories;

export interface IRequireRegistrarProps<T extends IRegisterType> {
    registerOpts: IRegisterOptions<T>;
    programOpts: IRegistrarProgramOpts;
}

class RequireRegistrar<T extends IRegisterType> {
    private registered = false;
    private active = false;
    private type!: T;
    private registerOpts!: IRegisterOptions<T>;
    private programOpts!: IRegistrarProgramOpts;
    private extensions = ['.ts', '.tsx'];

    constructor() {
        this.ignore = this.ignore.bind(this);
        this.only = this.only.bind(this);
    }

    public init(type: T, props: IRequireRegistrarProps<T>): void {
        this.type = type;
        this.registerOpts = props.registerOpts;
        this.programOpts = props.programOpts;
    }

    public start(): void {
        if (!this.type)
            throw new Error('[gatsby-plugin-ts-config] Compiler registration was started before it was initialized!');
        this.active = true;
        if (!this.registered) this.register();
    }

    public stop(): void {
        this.active = false;
    }

    private ignore(filename: string): boolean {
        if (!this.active) return true;
        switch (this.type) {
            case 'ts-node': {
                if (this.extensions.includes(path.extname(filename))) return true;
                break;
            }
            case 'babel': {
                if (filename.indexOf('node_modules') > -1) return true;
                break;
            }
        }
        return false;
    }

    private only(filename: string): boolean {
        return !this.ignore(filename);
    }

    private register(): void {
        if (this.registered) return;
        const { projectRoot } = this.programOpts;

        switch (this.type) {
            case 'ts-node': {
                const tsNodeOpts = this.registerOpts as IRegisterOptions<'ts-node'>;
                const compilerOptions = {
                    module: "commonjs",
                    target: "es2015",
                    allowJs: false,
                    noEmit: true,
                    declaration: false,
                    importHelpers: true,
                    resolveJsonModule: true,
                    jsx: "preserve",
                    ...tsNodeOpts.compilerOptions || {},
                };

                const tsNodeService = register({
                    project: path.join(projectRoot, 'tsconfig.json'),
                    compilerOptions,
                    files: true,
                    ...tsNodeOpts,
                });

                tsNodeService.ignored = this.ignore;
                break;
            }
        }
        this.registered = true;
    }
}

export default new RequireRegistrar();