import * as path from 'path';

export const getAbsoluteRelativeTo = (from: string, to?: string): string => {
    if (to && path.isAbsolute(to)) return to;
    const absolute = path.join(
        path.isAbsolute(from) ? from : path.resolve(from),
        to || ''
    );
    return absolute;
}