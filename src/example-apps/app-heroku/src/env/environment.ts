export type Environment = { [key: string]: string | undefined };

export class Env {
    constructor(private env: Environment) {
    }

    get(envVar: string): string | undefined {
        return this.env[envVar];
    }

    isProduction(envVar: string = "NODE_ENV") {
        return this.env?.[envVar] === 'production';
    }
}