export interface Logger {
    log(...args: string[]): void
}

export class LoggerConsole implements Logger {
    log(...args: string[]): void {
        return console.log(args);
    }
}

export class LoggerInMemory implements Logger {
    constructor(public logs: string[] = []) {
    }

    log(...args: string[]): void {
        this.logs.push(args.join('\n'));
    }
}