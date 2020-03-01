export const throwError = (message: string, err?: string | Error) => {
    if (err instanceof Error) {
        err.message = [message, err.message].join('\n');
        throw err;
    }
    throw new Error([message, err].join('\n'));
};