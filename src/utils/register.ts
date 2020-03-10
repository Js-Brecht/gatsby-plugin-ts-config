import * as path from 'path';
import { register } from 'ts-node';
import babelRegister, { revert } from '@babel/register';
import { IRegisterOptions, IRegisterType, ICommonDirectories } from '../types';
import { throwError } from './errors';

export type IRegistrarProgramOpts = ICommonDirectories;

export interface IRequireRegistrarProps<T extends IRegisterType> {
    registerOpts: IRegisterOptions<T>;
}

class RequireRegistrar<T extends IRegisterType> {
    private initialized = false;
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

    public get ext(): string[] {
        return this.extensions;
    }

    public init(type: T, props: IRequireRegistrarProps<T>): void {
        this.type = type;
        this.registerOpts = props.registerOpts;
        this.programOpts = props.programOpts;
        this.initialized = true;
    }

    public start(): void {
        if (!this.initialized)
            throwError('[gatsby-plugin-ts-config] Compiler registration was started before it was initialized!', new Error());
        this.active = true;
        if (!this.registered) this.register();
    }

    public stop(): void {
        this.active = false;
        if (this.type === 'babel') {
            revert();
            this.registered = false;
        }
    }

    private ignore(filename: string): boolean {
        if (!this.active) return true;
        switch (this.type) {
            case 'ts-node': {
                if (!this.extensions.includes(path.extname(filename))) return true;
                break;
            }
            case 'babel': {
                if (filename.indexOf('node_modules') > -1) return true;
                break;
            }
        }
        if (filename.endsWith('/.pnp.js')) return true;
        return false;
    }

    private only(filename: string): boolean {
        return !this.ignore(filename);
    }

    private register(): void {
        if (this.registered) return;

        switch (this.type) {
            case 'ts-node': {
                const opts = this.registerOpts as IRegisterOptions<'ts-node'>;
                const tsNodeService = register(opts);
                tsNodeService.ignored = this.ignore;
                break;
            }
            case 'babel': {
                const opts = this.registerOpts as IRegisterOptions<'babel'>;
                babelRegister({
                    ...opts,
                    extensions: this.extensions,
                    only: [this.only],
                });
                break;
            }
        }
        this.registered = true;
    }
}

export default new RequireRegistrar();
