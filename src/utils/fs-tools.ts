import * as path from 'path';
import * as fs from 'fs';
import { IValidExts } from '../types';

export const allExt: IValidExts[] = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
];

export const getAbsoluteRelativeTo = (from: string, to?: string): string => {
    if (to && path.isAbsolute(to)) return to;
    const absolute = path.join(
        path.isAbsolute(from) ? from : path.resolve(from),
        to || '',
    );
    return absolute;
};

export const fileExists = (fPath: string): fs.Stats | void => {
    try {
        const fStats = fs.statSync(fPath);
        if (fStats) return fStats;
    } catch (err) {
        // noop
    }
};

export const checkFileWithExts = (fPath: string, extensions: IValidExts[] = allExt): string => {
    for (const ext of extensions) {
        if (fileExists(fPath + ext)) return fPath + ext;
    }
    return '';
};

export const isDir = (fPath: string): boolean => {
    try {
        const fStats = fs.statSync(fPath);
        if (fStats.isDirectory()) return true;
    } catch (err) {
        // noop
    }

    return false;
};