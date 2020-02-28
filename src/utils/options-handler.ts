import { IGlobalOpts } from "../types";

class OptionsHandler {
    private opts = {} as IGlobalOpts;

    public set(args: IGlobalOpts) {
        this.opts = args;
    }

    public get(): IGlobalOpts {
        return this.opts;
    }
}

export default new OptionsHandler();