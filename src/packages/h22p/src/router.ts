import {
    h22p,
    HttpHandler,
    HttpMessageBody,
    HttpRequest,
    HttpRequestBody,
    HttpResponse,
    JsonBody,
    Method,
    MethodWithBody,
    TypedHttpHandler
} from "./interface";

export class Router implements HttpHandler {
    constructor(public routes: Route<any, string, Method>[]) {
    }

    handle(req: HttpRequest): Promise<HttpResponse<any>> {
        const notFoundHandler = {
            async handle(req: HttpRequest): Promise<HttpResponse<string>> {
                return h22p.response({status: 404, body: "Not found"})
            }
        };
        const apiHandler = this.matches(req.path, req.method);
        if (apiHandler.route) {
            const typedReq: TypedHttpRequest<any, string, Method> = Object.defineProperty(req, 'vars', {
                value: {
                    path: apiHandler.data.matches,
                    wildcards: apiHandler.data.wildcards
                }
            }) as TypedHttpRequest<any, string, Method>;
            return apiHandler.route.handler.handle(typedReq);
        } else {
            return notFoundHandler.handle(req);
        }
    }

    private matches(path: string, method: string): {
        route?: Route<any, string, Method>,
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

export function router(routes: Route<any, string, Method>[] | UntypedRoutes) {
    if (Array.isArray(routes))
        return new Router(routes);
    else return new Router(Object.values(routes))
}

export function post<
    J extends JsonBody,
>() {
    return function <
        S extends string = string,
        M extends Method = Method,
        T extends TypedHttpRequest<J, S, M> = TypedHttpRequest<J, S, M>,
        Res extends HttpMessageBody = any
    >(
        method: M,
        path: S,
        handler: (req: TypedHttpRequest<J, S, M>) => Promise<HttpResponse<Res>>): Route<J, S, M> {
        return {
            path,
            method: method,
            handler: {handle: handler}
        }
    }
}

export function route<
    B extends HttpMessageBody,
    S extends string = string,
    M extends Method = Method,
    T extends TypedHttpRequest<B, S, M> = TypedHttpRequest<B, S, M>,
    Res extends HttpMessageBody = any
>(
    method: M,
    path: S,
    handler: (req: TypedHttpRequest<B, S, M>) => Promise<HttpResponse<Res>>): Route<B, S, M> {
    return {
        path,
        method: method,
        handler: {handle: handler}
    };
}

type isPathParameter<Part> = Part extends `{${infer Name}}` ? Name : never;
type pathParameters<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? isPathParameter<PartA> | pathParameters<PartB>
    : isPathParameter<Path>;
export type PathParameters<Path> = {
    [Key in pathParameters<Path>]: string;
};

export type TypedHttpRequest<
    B extends HttpMessageBody,
    Path extends string,
    M extends Method,
> = HttpRequest<B, Path, M> & {
    vars: { path: PathParameters<Path>, wildcards: string[] }
}

export type Route<
    B extends HttpMessageBody,
    Path extends string,
    Mtd extends Method> = {
    path: Path;
    handler: TypedHttpHandler<B, Path, Mtd>;
    method: Mtd;
};

type backToPath<Part, T extends pathParameters<Part> = pathParameters<Part>> = Part extends `{${infer Name}}` ? string : Part;
type reversePathParameters<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? `${backToPath<PartA>}/${reversePathParameters<PartB>}`
    : backToPath<Path>;


export type UntypedRoutes<
    B extends HttpMessageBody = any,
    Path extends string = string,
    M extends Method = Method
> = { [k: string]: Route<B, Path, M> };

export type Contract<
    B extends HttpMessageBody,
    Path extends string,
    Routes extends UntypedRoutes<B, Path>
> = {
    [Key in keyof Routes]: Routes[Key] extends Route<infer J extends JsonBody, infer Path extends string, infer Mtd extends Method>
        ? Mtd extends MethodWithBody
            ? (vars: PathParameters<Path>, body: HttpRequestBody<J, Mtd>) => TypedHttpRequest<J, Path, Mtd>
            : (vars: PathParameters<Path>) => TypedHttpRequest<J, Path, Mtd>
        : (vars: PathParameters<string>, body: HttpRequestBody<any, Method>) => TypedHttpRequest<any, string, Method>
};

export function contractFrom<
    B extends HttpMessageBody,
    Path extends string,
    M extends Method,
    R extends UntypedRoutes<B, Path, M>,
>(routes: R): Contract<B, Path, R> {
    let ret = {} as any;
    for (let f in routes) {
        let y: keyof typeof routes = f;
        const route = routes[f]
        ret[y] = (vars: PathParameters<Path>, body?: B) => {
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
                body: body,
            } as unknown as TypedHttpRequest<B, Path, M>;
        }
    }
    return ret;
}
