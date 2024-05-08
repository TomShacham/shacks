import {
    h22p,
    HttpHandler,
    HttpMessageBody,
    HttpRequest,
    HttpRequestBody,
    HttpRequestHeaders,
    HttpResponse,
    isReadMethod,
    MessageBody,
    MessageType,
    Method,
    ReadMethods,
    TypedHttpHandler,
    WriteMethods
} from "./interface";
import {h22pStream, isH22PStream} from "./body";
import {URI} from "./uri";
import {Query} from "./query";

export class Router implements HttpHandler {
    constructor(public routes: Route<any, string, Method, HttpRequestHeaders>[]) {
    }

    handle(req: HttpRequest): Promise<HttpResponse> {
        const notFoundHandler = this.notFound();
        const matchingHandler = this.matches(req.path, req.method);
        if (matchingHandler.route) {
            const typedReq = Object.defineProperty(req, 'vars', {
                value: matchingHandler.vars
            }) as TypedHttpRequest<any, any, string, Method, HttpRequestHeaders>;
            return matchingHandler.route.handler.handle(typedReq);
        } else {
            return notFoundHandler.handle(req);
        }
    }

    private matches(path: string, method: string): {
        route?: Route<any, string, Method, HttpRequestHeaders>,
        vars: { path: NodeJS.Dict<string>, query: NodeJS.Dict<string>, wildcards: string[] }
    } {
        for (const route of this.routes) {
            if (route.method === method && route.path !== undefined) {
                const query = Query.parse(URI.of(path).query);
                const noQuery = route.path.split("?")[0];
                const noTrailingSlash = (noQuery !== '/' && noQuery.endsWith('/')) ? noQuery.slice(0, -1) : noQuery;
                const exactMatch = noTrailingSlash === path;
                if (exactMatch) return {route, vars: {path: {}, query, wildcards: []}}
                const regex = this.regexCapturingVars(noTrailingSlash);
                const pathNoQuery = path.split("?")[0];
                const matches = regex.test(pathNoQuery);
                if (matches) {
                    const groups = pathNoQuery.match(regex)!.groups as NodeJS.Dict<string>;
                    if (groups) return {
                        route, vars: this.populateVars(groups, query)

                    }
                }
            }
        }
        return {vars: {path: {}, query: {}, wildcards: []}}
    }

    private regexCapturingVars(noTrailingSlash: string) {
        let s = noTrailingSlash.replaceAll(/\{(\w+)}/g, '(?<$1>[^\/]+)');
        for (const wildcard of s.split('*')) {
            s = s.replace('*', `(?<wildcard_${this.randomString(10)}>.+)`)
        }
        return new RegExp(s);
    }

    private populateVars(groups: NodeJS.Dict<string>, query: NodeJS.Dict<string>) {
        return Object.entries(groups).reduce((acc, [k, v]) => {
            if (k.startsWith('wildcard')) acc.wildcards.push(v!)
            else acc.path[k] = v!;
            return acc;
        }, ({
            wildcards: [] as string[],
            path: {} as { [k: string]: string },
            query: query
        }));
    }

    private notFound() {
        return {
            async handle(req: HttpRequest): Promise<HttpResponse<string>> {
                return h22p.response({status: 404, body: "Not found"})
            }
        };
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

export function router(routes: Route<any, string, Method, HttpRequestHeaders>[] | UntypedRoutes) {
    if (Array.isArray(routes))
        return new Router(routes);
    else return new Router(Object.values(routes))
}

export function write<
    Msg extends MessageBody<B>,
    Res extends HttpMessageBody = any,
    // required headers
    Hds extends HttpRequestHeaders = {},
    B extends HttpMessageBody = MessageType<Msg>,
>() {
    return function <
        S extends string = string,
        M extends WriteMethods = WriteMethods,
        T extends TypedHttpRequest<B, h22pStream<B>, S, M, Hds> = TypedHttpRequest<B, h22pStream<B>, S, M, Hds>,
    >(
        method: M,
        path: S,
        handler: (req: T) => Promise<HttpResponse<Res>>,
        headers: Hds = ({} as Hds),
    ): Route<B, S, M, Hds> {
        return {
            path,
            method: method,
            headers,
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
    ResB extends HttpMessageBody,
    // required headers
    Hds extends HttpRequestHeaders = {},
>() {
    return function <
        B extends HttpMessageBody,
        S extends string = string,
        M extends ReadMethods = ReadMethods,
        T extends TypedHttpRequest<B, h22pStream<B>, S, M, Hds> = TypedHttpRequest<B, h22pStream<B>, S, M, Hds>,
    >(
        method: M,
        path: S,
        handler: (req: T) => Promise<HttpResponse<ResB>>,
        headers: Hds = ({} as Hds),
    ): Route<B, S, M, Hds> {
        return {
            path,
            method: method,
            headers,
            handler: {
                handle: async (req: T) => {
                    // doesn't need an h22p stream because there is no request body for read
                    return handler(req)
                }
            }
        };
    }
}

type isPathParameter<Part> = Part extends `{${infer Name}}` ? Name : never;
type pathParameters<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? isPathParameter<PartA> | pathParameters<PartB>
    : isPathParameter<Path>;
type isQueryParameter<Part> = Part extends `${infer Name}&${infer Rest}` ? Name | isQueryParameter<Rest> : Part;
type queryParameters<Path> = Path extends `${infer PartA}?${infer PartB}`
    ? isQueryParameter<PartB>
    : never;

export type PathParameters<Path> = {
    [Key in pathParameters<Path>]: string;
};
export type QueryParameters<Path> = {
    [Key in queryParameters<Path>]: string;
};

export type UriParameters<Path> =
    keyof PathParameters<Path> extends never
        ? keyof QueryParameters<Path> extends never
            ? {}
            : {
                query: {
                    [Key in queryParameters<Path>]: string
                }
            }
        : keyof QueryParameters<Path> extends never
            ? {
                path: {
                    [Key in pathParameters<Path>]: string;
                }
            }
            : {
                path: {
                    [Key in pathParameters<Path>]: string;
                },
                query: {
                    [Key in queryParameters<Path>]: string
                }
            }


export type TypedHttpRequest<
    B extends HttpMessageBody,
    Msg extends MessageBody<B>,
    Path extends string,
    M extends Method,
    H extends HttpRequestHeaders,
> = HttpRequest<B, Msg, Path, M> & {
    headers: H & HttpRequestHeaders,
    vars: { path: PathParameters<Path>, query: QueryParameters<Path>, wildcards: string[] }
}

export type Route<
    B extends HttpMessageBody,
    Path extends string,
    Mtd extends Method,
    H extends HttpRequestHeaders,
> = {
    path: Path;
    method: Mtd;
    handler: TypedHttpHandler<B, h22pStream<B>, Path, Mtd>;
    headers: H,
};

export type UntypedRoutes<
    B extends HttpMessageBody = any,
    Path extends string = string,
    M extends Method = Method,
    Msg extends MessageBody<B> = MessageBody<B>,
    H extends HttpRequestHeaders = HttpRequestHeaders,
> = { [k: string]: Route<B, Path, M, H> };

export type Contract<
    B extends HttpMessageBody,
    Path extends string,
    Routes extends UntypedRoutes<B, Path>
> = {
    [Key in keyof Routes]: Routes[Key] extends Route<
            infer B extends HttpMessageBody,
            infer Path extends string,
            infer Mtd extends Method,
            infer Hds extends HttpRequestHeaders>
        ? Mtd extends WriteMethods
            ? keyof Hds extends never
                ? (vars: UriParameters<Path>, body: HttpRequestBody<B, Mtd>) => TypedHttpRequest<B, h22pStream<B>, Path, Mtd, Hds>
                : (vars: UriParameters<Path>, body: HttpRequestBody<B, Mtd>, headers: Hds) => TypedHttpRequest<B, h22pStream<B>, Path, Mtd, Hds>
            : keyof Hds extends never
                ? (vars: UriParameters<Path>) => TypedHttpRequest<B, h22pStream<B>, Path, Mtd, Hds>
                : (vars: UriParameters<Path>, headers: Hds) => TypedHttpRequest<B, h22pStream<B>, Path, Mtd, Hds>
        : (vars: UriParameters<string>, body: HttpRequestBody<any, Method>, headers: HttpRequestHeaders) => TypedHttpRequest<any, h22pStream<any>, string, Method, HttpRequestHeaders>
};

// TODO should contract give you an HttpRequest or a TypedHttpRequest?
// should it have this h22pStream body or should it be more universal

export function contractFrom<
    B extends HttpMessageBody,
    Path extends string,
    M extends Method,
    R extends UntypedRoutes<B, Path, M>,
    Hds extends HttpRequestHeaders = {},
    Msg extends MessageBody<B> = MessageBody<B>,
>(routes: R): Contract<B, Path, R> {
    let ret = {} as any;
    for (let f in routes) {
        let y: keyof typeof routes = f;
        const route = routes[f];
        const isRead = isReadMethod(route.method);
        ret[y] = isRead
            ? (vars: UriParameters<Path>, headers?: Hds) => {
                const withPathValues = insertPathValues(vars, route, route.path);
                const fullPath = insertQueryValues(vars, route, withPathValues);

                return {
                    vars: {...vars, wildcards: []},
                    path: fullPath,
                    method: route.method,
                    headers: headers,
                    body: h22pStream.from(undefined),
                } as unknown as TypedHttpRequest<B, h22pStream<B>, Path, M, Hds>;
            }
            : (vars: UriParameters<Path>, body?: B, headers?: Hds) => {
                const replaced = insertPathValues(vars, route, route.path);

                return {
                    vars: {...vars, wildcards: []},
                    path: replaced,
                    method: route.method,
                    headers: headers,
                    body: h22pStream.from(body),
                } as unknown as TypedHttpRequest<B, h22pStream<B>, Path, M, Hds>;
            }
    }

    function insertPathValues(vars: UriParameters<Path>, route: Route<B, Path, M, HttpRequestHeaders>, path: string): string {
        const keys = 'path' in vars ? Object.keys(vars.path) : [];
        return keys.reduce((acc, next) => {
            // @ts-ignore
            const var1 = vars.path[next];
            return acc.replace(`{${next}}`, var1)
        }, path) as any;
    }

    function insertQueryValues(vars: UriParameters<Path>, route: Route<B, Path, M, HttpRequestHeaders>, path: string) {
        const keys = 'query' in vars ? Object.keys(vars.query) : [];
        return keys.reduce((acc, next) => {
            // @ts-ignore
            const var1 = vars.query[next];
            return acc.replace(`${next}`, `${next}=${var1}`)
        }, path) as any;
    }

    return ret;
}
