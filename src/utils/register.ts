import { register } from 'ts-node';
import babelRegister from '@babel/register';
import { IRegisterOptions, IRegisterType, ICommonDirectories, IConfigTypes } from '../types';
import { throwError } from './errors';
import optionsHandler from './options-handler';

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
    private extensions = ['.ts', '.tsx', '.js', '.jsx'];
    private endpoint?: IConfigTypes;
    private origExtensions = {
        ...require.extensions,
    }

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
        this.initialized = true;
    }

    public start(endpoint: IConfigTypes): void {
        if (!this.initialized)
            throwError('[gatsby-plugin-ts-config] Compiler registration was started before it was initialized!', new Error());
        this.active = true;
        this.endpoint = endpoint;
        if (!this.registered) this.register();
    }

    public stop(): void {
        this.active = false;
    }

    public revert(): void {
        this.active = false;
        this.registered = false;
        require.extensions = this.origExtensions;
    }

    private ignore(filename: string): boolean {
        if (!this.active) return true;
        if (filename.indexOf('node_modules') > -1) return true;
        if (filename.endsWith('.pnp.js')) return true;
        if (this.endpoint) optionsHandler.addChainedImport(this.endpoint, filename);
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
