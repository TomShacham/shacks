import {h22p, HttpHandler, HttpRequest, HttpResponse, Method, TypedHttpHandler} from "./interface";

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
            const typedReq: TypedHttpRequest<string, Method> = Object.defineProperty(req, 'vars', {
                value: {
                    path: apiHandler.data.matches,
                    wildcards: apiHandler.data.wildcards
                }
            }) as TypedHttpRequest<string, Method>;
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

export function route<S extends string, M extends Method>(method: M, path: S, handler: (req: TypedHttpRequest<S, M>) => Promise<HttpResponse>): Route<S, M> {
    return {
        path,
        method: method,
        handler: {
            async handle(req: TypedHttpRequest<S, M>): Promise<HttpResponse> {
                return handler(req);
            }
        }
    };
}

type isPathParameter<Part> = Part extends `{${infer Name}}` ? Name : never;
type pathParameters<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? isPathParameter<PartA> | pathParameters<PartB>
    : isPathParameter<Path>;
export type PathParameters<Path> = {
    [Key in pathParameters<Path>]: string;
};

export type TypedHttpRequest<Path extends string = string, M extends Method = Method> = HttpRequest<Path, M> & {
    vars: { path: PathParameters<Path>, wildcards: string[] }
}

export type Route<Path extends string, Mtd extends Method> = {
    path: Path;
    handler: TypedHttpHandler;
    method: Mtd
};

type backToPath<Part, T extends pathParameters<Part> = pathParameters<Part>> = Part extends `{${infer Name}}` ? string : Part;
type reversePathParameters<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? `${backToPath<PartA>}/${reversePathParameters<PartB>}`
    : backToPath<Path>;


export type UntypedRoutes<Path extends string = string> = { [k: string]: Route<Path, Method> };

export type Contract<Routes extends UntypedRoutes> = {
    [Key in keyof Routes]: Routes[Key] extends Route<infer Path extends string, infer Mtd extends Method>
        ? (vars: PathParameters<Path>) => TypedHttpRequest<Path, Mtd>
        : (vars: PathParameters<string>) => TypedHttpRequest
};
export type Api<Routes extends UntypedRoutes> = {
    [Key in keyof Routes]: Routes[Key] extends Route<infer Path extends string, infer Mtd extends Method>
        ? Route<Path, Mtd>
        : Route<string, Method>
};

export function contractFrom<Path extends string, R extends UntypedRoutes<Path>, T extends Api<R>>(routes: R): Contract<R> {
    let ret = {} as any;
    for (let f in routes) {
        let y: keyof typeof routes = f;
        const route = routes[f]
        ret[y] = (vars: PathParameters<Path>) => {
            const keys = Object.keys(vars);
            const replaced = keys.reduce((acc, next) => {
                // @ts-ignore
                const var1 = vars[next];
                return acc.replace(`{${next}}`, var1)
            }, route.path) as any;

            return {
                vars: {...{path: vars}, wildcards: []},
                path: replaced,
                method: route.method,
                headers: {},
            } as TypedHttpRequest;
        }
    }
    return ret;
}
