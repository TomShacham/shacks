import {h22p, HttpHandler, HttpRequest, HttpResponse, Method} from "./interface";

type Route<S extends string> = {
    path: S;
    handler: { handle(req: TypedHttpRequest<S>): Promise<HttpResponse> };
    method: string
};

export class Router implements HttpHandler {
    constructor(public routes: Route<string>[]) {
    }

    handle(req: HttpRequest): Promise<HttpResponse> {
        const notFoundHandler = {
            async handle(req: HttpRequest): Promise<HttpResponse> {
                return h22p.response({status: 404, body: "Not found"})
            }
        };
        const apiHandler = this.matches(req.path, req.method);
        if (apiHandler.route) {
            const typedReq: TypedHttpRequest = Object.defineProperty(req, 'vars', {
                value: {
                    path: apiHandler.data.matches,
                    wildcards: apiHandler.data.wildcards
                }
            }) as TypedHttpRequest;
            return apiHandler.route.handler.handle(typedReq);
        } else {
            return notFoundHandler.handle(req);
        }
    }

    private matches(path: string, method: string): {
        route?: Route<string>,
        data: { matches: NodeJS.Dict<string>, wildcards: string[] }
    } {
        for (const route of this.routes) {
            const noTrailingSlash = (route.path !== '/' && route.path.endsWith('/')) ? route.path.slice(0, -1) : route.path;
            const exactMatch = noTrailingSlash === path && route.method === method;
            if (exactMatch) return {route, data: {matches: {}, wildcards: []}}
            let s = noTrailingSlash
                .replaceAll(/\{(\w+)}/g, '(?<$1>[^\/]+)');
            for (const wildcard of s.split('*')) {
                s = s.replace('*', `(?<wildcard_${this.randomString(10)}>.+)`)
            }
            const regExp = new RegExp(s);
            const regExpMatches = regExp.test(path);
            if (regExpMatches) {
                const matches = path.match(regExp)!.groups as NodeJS.Dict<string>;
                const data = matches
                    ? Object.entries(matches).reduce((acc, [k, v]) => {
                        if (k.startsWith('wildcard')) acc.wildcards.push(v!)
                        else acc.matches[k] = v!;
                        return acc;
                    }, ({wildcards: [] as string[], matches: {} as { [k: string]: string }}))
                    : {matches: {}, wildcards: []}
                if (matches) return {route, data}
            }
        }
        return {data: {matches: {}, wildcards: []}}
    }

    private randomString(length: number): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let randomString = '';

        for (let i = 0; i < length; i++) {
            randomString += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return randomString;
    }

}

export function router(routes: Route<string>[]) {
    return new Router(routes);
}

export function route<S extends string>(method: Method, path: S, handler: (req: TypedHttpRequest<S>) => Promise<HttpResponse>): Route<S> {
    return {
        path,
        method: method,
        handler: {
            async handle(req: TypedHttpRequest<S>): Promise<HttpResponse> {
                return handler(req);
            }
        }
    };
}

type isPathParameter<Part> = Part extends `{${infer Name}}` ? Name : never;
type pathParameters<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? isPathParameter<PartA> | pathParameters<PartB>
    : isPathParameter<Path>;
type PathParameters<Path> = {
    [Key in pathParameters<Path>]: string;
};
export type TypedHttpRequest<S extends string = string> = HttpRequest & {
    vars: { path: PathParameters<S>, wildcards: string[] }
}