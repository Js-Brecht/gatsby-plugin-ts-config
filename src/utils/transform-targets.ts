import * as path from 'path';
import { TransformOptions } from '@babel/core';

import { isDir, checkFileWithExts, allExt } from './fs-tools';
import { transformCodeToFile } from './babel';

export interface ITransformTarget {
    srcFile: string;
    targetFileName: string;
    relativePath: string;
}

export class TransformTargets {
    private opts: TransformOptions;
    private cacheDir: string;
    private projectRoot: string;
    private targets: ITransformTarget[];

    constructor(projectRoot: string, cacheDir: string, opts: TransformOptions) {
        this.projectRoot = projectRoot;
        this.cacheDir = cacheDir;
        this.opts = opts;
        this.targets = [];
    }

    private mergeImports(curSrcFile: string, imports: string[]): void {
        imports.forEach((thisImport) => {
            if (/^[.]/.test(thisImport[0])) { // process relative imports
                const pathFromSrc = path.join(path.dirname(curSrcFile), thisImport);
                const resPath = path.resolve(path.normalize(pathFromSrc));

                const importIsDir = isDir(resPath);

                const srcFile = importIsDir
                    ? checkFileWithExts(path.join(resPath, 'index'), allExt)
                    : resPath;
                const targetFileName = importIsDir
                    ? 'index.js'
                    : path.basename(srcFile).replace(/\.tsx?$/, '.js');

                const relativePath = path.relative(this.projectRoot, path.dirname(srcFile));

                // We aren't processing files outside of the project root directory
                if (relativePath.slice(0, 2) === '..') return;

                this.targets.push({
                    srcFile,
                    targetFileName,
                    relativePath,
                });
            }
        });
    }

    public transform(target: ITransformTarget) {
        const results = transformCodeToFile({
            ...target,
            cacheDir: this.cacheDir,
            opts: this.opts,
        });
        if (results.imports.length > 0) {
            this.mergeImports(target.srcFile, results.imports);
        }
        return results;
    }

    public start(): void {
        while (this.targets.length > 0) {
            const target = this.targets.shift();
            if (target)
                this.transform(target);
        }
    }
}