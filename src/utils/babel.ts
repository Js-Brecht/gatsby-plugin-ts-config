import * as fs from 'fs';
import template from '@babel/template';
import generate from '@babel/generator';
import { StringLiteral } from '@babel/types';

export interface IInterpolateSpec {
    __TS_CONFIG_ENDPOINT_PATH: StringLiteral;
}
export interface ITransformCodeToTemplateProps {
    srcFile: string;
    targetFile: string;
    templateSpec: IInterpolateSpec;
}
export const transformCodeToTemplate = ({
    srcFile,
    targetFile,
    templateSpec,
}: ITransformCodeToTemplateProps): boolean => {
    try {
        const code = fs.readFileSync(srcFile).toString();
        const buildTemplate = template.program(code);
        const ast = buildTemplate(templateSpec);
        const output = generate(ast).code;
        fs.writeFileSync(targetFile, output);
        return true;
    } catch (err) {
        // noop
    }
    return false;
};
