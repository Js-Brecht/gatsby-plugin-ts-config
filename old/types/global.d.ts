declare module "@babel/register" {
    import { TransformOptions } from "@babel/core";
    type IOnlyFn = (filename: string) => boolean;
    export interface IRegisterOptions extends TransformOptions {
        extensions?: string[];
        only?: string | RegExp | IOnlyFn | null | Array<
            | string
            | RegExp
            | IOnlyFn
        >;
    }
    declare const register: (args: IRegisterOptions) => void;
    export declare const revert: () => void;
    export default register;
}
