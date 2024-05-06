import {
    h22p,
    HttpHandler,
    HttpMessageBody,
    HttpRequest,
    HttpRequestBody,
    HttpResponse,
    MessageBody,
    Method,
    ReadMethods,
    TypedHttpHandler,
    WriteMethods
} from "./interface";
import {h22pStream, isH22PStream} from "./body";

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
            const typedReq: TypedHttpRequest<any, any, string, Method> = Object.defineProperty(req, 'vars', {
                value: {
                    path: apiHandler.data.matches,
                    wildcards: apiHandler.data.wildcards
                }
            }) as TypedHttpRequest<any, any, string, Method>;
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
            if (route.method === method) {
                const noTrailingSlash = (route.path !== '/' && route.path.endsWith('/')) ? route.path.slice(0, -1) : route.path;
                const exactMatch = noTrailingSlash === path;
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

export function write<
    B extends HttpMessageBody,
>() {
    return function <
        S extends string = string,
        M extends WriteMethods = WriteMethods,
        T extends TypedHttpRequest<B, h22pStream<B>, S, M> = TypedHttpRequest<B, h22pStream<B>, S, M>,
        Res extends HttpMessageBody = any
    >(
        method: M,
        path: S,
        handler: (req: T) => Promise<HttpResponse<Res>>): Route<B, S, M> {
        return {
            path,
            method: method,
            handler: {
                handle: async (req: T) => {
                    // Important: this guarantees the same contract in memory and over the wire
                    // we want an h22pStream so that req.body always has the type of stream
                    // but also preserves the type of the body (stream.Readable doesn't have a type parameter)
                    if (!isH22PStream(req.body)) {
                        req.body = h22pStream.from(req.body)
                        return handler(req)
                    }
                    return handler(req);
                }
            }
        }
    }
}

export function read<
    B extends HttpMessageBody,
    S extends string = string,
    M extends ReadMethods = ReadMethods,
    T extends TypedHttpRequest<B, h22pStream<B>, S, M> = TypedHttpRequest<B, h22pStream<B>, S, M>,
    Res extends HttpMessageBody = any
>(
    method: M,
    path: S,
    handler: (req: T) => Promise<HttpResponse<Res>>): Route<B, S, M> {
    return {
        path,
        method: method,
        handler: {
            handle: async (req: T) => {
                // Important: this guarantees the same contract in memory and over the wire
                // we want an h22pStream so that req.body always has the type of stream
                // but also preserves the type of the body (stream.Readable doesn't have a type parameter)
                if (!isH22PStream(req.body)) {
                    req.body = h22pStream.from(req.body)
                    return handler(req)
                }
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

export type TypedHttpRequest<
    B extends HttpMessageBody,
    Msg extends MessageBody<B>,
    Path extends string,
    M extends Method,
> = HttpRequest<B, Msg, Path, M> & {
    vars: { path: PathParameters<Path>, wildcards: string[] }
}

export type Route<
    B extends HttpMessageBody,
    Path extends string,
    Mtd extends Method,
> = {
    path: Path;
    handler: TypedHttpHandler<B, h22pStream<B>, Path, Mtd>;
    method: Mtd;
};

type backToPath<Part, T extends pathParameters<Part> = pathParameters<Part>> = Part extends `{${infer Name}}` ? string : Part;
type reversePathParameters<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? `${backToPath<PartA>}/${reversePathParameters<PartB>}`
    : backToPath<Path>;


export type UntypedRoutes<
    B extends HttpMessageBody = any,
    Path extends string = string,
    M extends Method = Method,
    Msg extends MessageBody<B> = MessageBody<B>,
> = { [k: string]: Route<B, Path, M> };

export type Contract<
    B extends HttpMessageBody,
    Path extends string,
    Routes extends UntypedRoutes<B, Path>
> = {
    [Key in keyof Routes]: Routes[Key] extends Route<infer B extends HttpMessageBody, infer Path extends string, infer Mtd extends Method>
        ? Mtd extends WriteMethods
            ? (vars: PathParameters<Path>, body: HttpRequestBody<B, Mtd>) => TypedHttpRequest<B, h22pStream<B>, Path, Mtd>
            : (vars: PathParameters<Path>) => TypedHttpRequest<B, h22pStream<B>, Path, Mtd>
        : (vars: PathParameters<string>, body: HttpRequestBody<any, Method>) => TypedHttpRequest<any, h22pStream<any>, string, Method>
};

export function contractFrom<
    B extends HttpMessageBody,
    Path extends string,
    M extends Method,
    R extends UntypedRoutes<B, Path, M>,
    Msg extends MessageBody<B> = MessageBody<B>,
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
                body: h22pStream.from(body),
            } as unknown as TypedHttpRequest<B, h22pStream<B>, Path, M>;
        }
    }
    return ret;
}
