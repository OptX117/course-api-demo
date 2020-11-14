import winston, { LeveledLogMethod, Logger } from 'winston';
import { serializeError } from 'serialize-error';

function getFileNameFromPathWithLineNumbers(path: string): string | undefined {
    const match = path.match(/.+[/\\](\D+\.\D+):\d+:\d+$|\(([^:]+).*?\)$/);
    return match?.[1] || match?.[2] || path;
}

function getCallerFromCallstack(info: any) {
    if (info.stack != null) {
        const stack = info.stack as string;
        const allFiles = stack.split('\n').slice(1).map(line => {
            const funcWithFile = line.match(/at\s(.+)\s\((.+)\)$/);
            if (funcWithFile != null) {
                return {
                    funcName: funcWithFile[1],
                    fileName: getFileNameFromPathWithLineNumbers(funcWithFile[2])?.replace(/\.\D+$/, '')
                };
            } else {
                const file = getFileNameFromPathWithLineNumbers(line);
                if (file != null) {
                    return {fileName: file.replace(/\.\D+$/, '')};
                }
            }
        })
            .filter(s => s != null &&
                         s.fileName != null &&
                         !['loader', 'anonymous'].some(f => s.fileName?.includes(f)))
            .filter(s => s != null &&
                         (s.funcName == null ||
                          !['anonymous', 'awaiter', 'generator'].some(f => s.funcName.includes(f)))
            ) as { fileName: string, funcName?: string }[];

        const func = allFiles.find(s => s.funcName != null)?.funcName;
        const file = allFiles[0]?.fileName;


        info.caller = {
            func, file
        };

        if (info.level !== 'error') {
            delete info.stack;
        }
    }
}


const logger = process.env.NODE_ENV !== 'test' ? winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                {
                    transform(info) {
                        getCallerFromCallstack(info);

                        return info;
                    }
                },
                winston.format.json({
                        replacer: (key, value) => {
                            if (value instanceof Error) {
                                return serializeError(value);
                            }

                            return value;
                        }
                    }
                )
            )
        })
    ]
}) : winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                {
                    transform: (info) => {
                        if (info.err != null) {
                            const error = info.err as Error;

                            if (error.stack != null) {
                                info.message = `${info.message}\nError: ${error.stack}`;
                            } else {
                                info.message = `${info.message}\nError: ${error.name}: ${error.message}`;
                            }
                        }

                        getCallerFromCallstack(info);

                        if (info.caller != null) {
                            info.prefix = `[${info.timestamp} - ${info.caller.func ? `${info.caller.func} in ${info.caller.file}` : info.caller.file} - ${info.level}]`;
                        } else {
                            info.prefix = `[${info.timestamp} - ${info.level}]`;
                        }

                        return info;
                    }
                },
                winston.format.printf((info) => {
                    return `${info.prefix} ${info.message}`;
                })
            )
        })
    ]
});

for (const logMethod of ['info', 'warn', 'data', 'error', 'debug', 'prompt', 'http', 'verbose', 'silly', 'input']) {
    const oldMethod: LeveledLogMethod = (logger as any)[logMethod];

    const getCallerInfo = function (...args: any[]) {
        const msg = args[0];
        const stack: any = {};
        Error.captureStackTrace(stack, getCallerInfo);

        let newArgs: any[];

        if (typeof args[1] === 'object' && !Array.isArray(args[1])) {
            args[1].stack = stack.stack;
            newArgs = [...args];
        } else {
            newArgs = [...args, stack];
        }


        return oldMethod(msg, ...newArgs.slice(1));
    };

    (logger as any)[logMethod] = getCallerInfo;

}

(logger as Logger & { finish(exitCode: number): void }).finish = (exitCode => {
    Promise.all([logger.transports.map((t) => {
        if (t.close != null) {
            t.close();
            return new Promise(resolve => t.on('finish', () => {
                resolve();
            }));
        }
        return Promise.resolve();
    })]).then(() => {
        console.info(`Exiting - Code ${exitCode}`);
        process.exit(exitCode);
    });
});

export default logger as Logger & { finish(exitCode: number): void };

