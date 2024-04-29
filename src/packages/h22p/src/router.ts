import {h22p, HttpHandler, HttpRequest, HttpResponse, Method} from "./interface";

export class Router implements HttpHandler {
    constructor(public routes: Route<string, Method>[]) {
    }

    handle(req: HttpRequest): Promise<HttpResponse> {
        const notFoundHandler = {
            async handle(req: HttpRequest): Promise<HttpResponse> {
                return h22p.response({status: 404, body: "Not found"})
            }
        };
        const apiHandler = this.matches(req.path, req.method);
        if (apiHandler.route) {
            const typedReq: TypedHttpRequest<string> = Object.defineProperty(req, 'vars', {
                value: {
                    path: apiHandler.data.matches,
                    wildcards: apiHandler.data.wildcards
                }
            }) as TypedHttpRequest<string>;
            return apiHandler.route.handler.handle(typedReq);
        } else {
            return notFoundHandler.handle(req);
        }
    }

    private matches(path: string, method: string): {
        route?: Route<string, Method>,
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

export function router(routes: Route<string, Method>[]) {
    return new Router(routes);
}

export function route<S extends string, M extends Method>(method: M, path: S, handler: (req: TypedHttpRequest<S>) => Promise<HttpResponse>): Route<S, M> {
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
export type TypedHttpRequest<S> = HttpRequest & {
    vars: { path: PathParameters<S>, wildcards: string[] }
}
export type Route<S, M> = {
    path: S;
    handler: { handle(req: TypedHttpRequest<S>): Promise<HttpResponse> };
    method: M
};

type SimpleReqForRoute<R extends Route<S, M>, S, M> = {
    method: M,
    path: { [K in pathParameters<S>]: string },
}

const r = route('GET', "/resource/{id}", async (req) => {
    const params = req.vars.path;
    return h22p.response({status: 200, body: `Hello ${params.id}`})
})

type X<R extends Route<S, M>, S, M> = SimpleReqForRoute<typeof r, typeof r.path, typeof r.method>

function XX<S, M>(route: Route<S, M>): X<Route<S, M>, S, M> {
    return {path: {id: '123'}, method: 'GET'}
}