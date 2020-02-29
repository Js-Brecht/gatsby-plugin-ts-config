import { keys } from 'ts-transformer-keys';
import { IGlobalOpts, IPublicOpts } from "../types";

const publicProps = keys<IPublicOpts>();

class OptionsHandler {
    private opts = {} as IGlobalOpts;
    private publicOpts = {} as IPublicOpts;

    public set(args: IGlobalOpts) {
        this.opts = args;
        this.publicOpts = Object.entries(this.opts)
            .filter(([key]) => publicProps.includes(key as keyof IPublicOpts))
            .reduce((acc, [key, val]) => {
                acc[key as keyof IPublicOpts] = val;
                return acc;
            }, {} as IPublicOpts);
    }

    public get(): IGlobalOpts {
        return this.opts;
    }

    public public(): IPublicOpts {
        return this.publicOpts;
    }
}

export default new OptionsHandler();