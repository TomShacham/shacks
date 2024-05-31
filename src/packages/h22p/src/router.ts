import {HttpHandler, HttpMessageBody, HttpRequest, HttpRequestHeaders, HttpResponse, Method} from "./interface";
import {Uri, URI} from "./uri";
import {UrlEncodedMessage} from "./urlEncodedMessage";
import {h22pStream} from "./body";
import {Res} from "./response";

export type handler<
    Mtd extends Method,
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
> = (req: RoutedHttpRequest<Mtd, Uri, ReqB, ReqHds>) => Promise<Res>

// this is lower case just so we can export class Route with all our routing methods
export type route<
    Mtd extends Method,
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
> = {
    handler: handler<Mtd, Uri, ReqB, ReqHds, Res>,
    request: (mtd: Mtd, uri: fullPath<Uri>, body: ReqB, headers: ReqHds) => HttpRequest<Mtd, fullPath<Uri>, ReqB, ReqHds>
    matcher: HttpRequest<Mtd, Uri, ReqB, ReqHds>
    responses: Res[]
};

export type Routes<
    Mtd extends Method = Method,
    Uri extends string = string,
    ReqB extends HttpMessageBody = HttpMessageBody,
    ReqHds extends HttpRequestHeaders = HttpRequestHeaders,
    Res extends HttpResponse = HttpResponse> = {
    [name: string]: route<Mtd, Uri, ReqB, ReqHds, Res>
}

export interface RoutedHttpRequest<
    Mtd extends Method = Method,
    Uri extends string = string,
    ReqB extends HttpMessageBody = any,
    ReqHds extends HttpRequestHeaders = HttpRequestHeaders
> extends HttpRequest<Mtd, fullPath<Uri>, ReqB, ReqHds> {
    vars?: {
        path: toObj<pathParameters<pathPart<Uri>>>
        query: queryParameters<queryPart<Uri>>
        fragment: string | undefined
        wildcards: string[]
    }
}

export class Route {
    static get = get;
    static head = head;
    static options = options;
    static connect = connect;
    static trace = trace;
    static post = post;
    static put = put;
    static patch = patch;
    static delete = del;
}

function get<
    Uri extends string,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
>(uri: Uri, handler: handler<"GET", Uri, undefined, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : route<"GET", Uri, undefined, ReqHds, Res> {
    return {
        handler: (req: RoutedHttpRequest<'GET', Uri, undefined, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            return handler(req);
        }
        ,
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher: ({method: 'GET', uri, body: undefined, headers: headers ?? {} as ReqHds}),
        responses: responses ?? []
    }
}

function head<
    Uri extends string,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
>(uri: Uri, handler: handler<"HEAD", Uri, undefined, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : route<"HEAD", Uri, undefined, ReqHds, Res> {
    return {
        handler: (req: RoutedHttpRequest<'HEAD', Uri, undefined, ReqHds>) => {
                Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            return handler(req);
            }
        ,
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher: ({method: 'HEAD', uri, body: undefined, headers: headers ?? {} as ReqHds}),
        responses: responses ?? []
    }
}

function options<
    Uri extends string,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
>(uri: Uri, handler: handler<"OPTIONS", Uri, undefined, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : route<"OPTIONS", Uri, undefined, ReqHds, Res> {
    return {
        handler: (req: RoutedHttpRequest<'OPTIONS', Uri, undefined, ReqHds>) => {
                Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            return handler(req);
            }
        ,
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher: ({method: 'OPTIONS', uri, body: undefined, headers: headers ?? {} as ReqHds}),
        responses: responses ?? []
    }
}

function connect<
    Uri extends string,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
>(uri: Uri, handler: handler<"CONNECT", Uri, undefined, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : route<"CONNECT", Uri, undefined, ReqHds, Res> {
    return {
        handler: (req: RoutedHttpRequest<'CONNECT', Uri, undefined, ReqHds>) => {
                Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            return handler(req);
            }
        ,
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher: ({method: 'CONNECT', uri, body: undefined, headers: headers ?? {} as ReqHds}),
        responses: responses ?? []
    }
}

function trace<
    Uri extends string,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
>(uri: Uri, handler: handler<"TRACE", Uri, undefined, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : route<"TRACE", Uri, undefined, ReqHds, Res> {
    return {
        handler: (req: RoutedHttpRequest<'TRACE', Uri, undefined, ReqHds>) => {
                Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            return handler(req);
            }
        ,
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher: ({method: 'TRACE', uri, body: undefined, headers: headers ?? {} as ReqHds}),
        responses: responses ?? []
    }
}

function post<
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse,
>(uri: Uri, body: ReqB, handler: handler<'POST', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : route<'POST', Uri, ReqB, ReqHds, Res> {
    return {
        handler: (req: RoutedHttpRequest<'POST', Uri, ReqB, ReqHds>) => {
                Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            return handler(req);
            }
        ,
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher: ({method: 'POST', uri, body, headers: headers ?? {} as ReqHds}),
        responses: responses ?? [],
    }
}

function put<
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse,
>(uri: Uri, body: ReqB, handler: handler<'PUT', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : route<'PUT', Uri, ReqB, ReqHds, Res> {
    return {
        handler: (req: RoutedHttpRequest<'PUT', Uri, ReqB, ReqHds>) => {
                Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            return handler(req);
            }
        ,
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher: ({method: 'PUT', uri, body, headers: headers ?? {} as ReqHds}),
        responses: responses ?? [],
    }
}

function patch<
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse,
>(uri: Uri, body: ReqB, handler: handler<'PATCH', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : route<'PATCH', Uri, ReqB, ReqHds, Res> {
    return {
        handler: (req: RoutedHttpRequest<'PATCH', Uri, ReqB, ReqHds>) => {
                Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            return handler(req);
            }
        ,
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher: ({method: 'PATCH', uri, body, headers: headers ?? {} as ReqHds}),
        responses: responses ?? [],
    }
}

function del<
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse,
>(uri: Uri, body: ReqB, handler: handler<'DELETE', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : route<'DELETE', Uri, ReqB, ReqHds, Res> {
    return {
        handler: (req: RoutedHttpRequest<'DELETE', Uri, ReqB, ReqHds>) => {
                Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            return handler(req);
            }
        ,
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher: ({method: 'DELETE', uri, body, headers: headers ?? {} as ReqHds}),
        responses: responses ?? [],
    }
}

type RouteMatch = {
    route: route<Method, string, any, HttpRequestHeaders, any>,
    vars: {
        path: NodeJS.Dict<string>,
        query: NodeJS.Dict<string>,
        fragment: string | undefined,
        wildcards: string[]
    }
};

export class Router implements HttpHandler {
    constructor(public routes: route<Method, string, any, HttpRequestHeaders, any>[]) {
    }

    static of(routes: { [key: string]: any }) {
        return new Router(Object.values(routes))
    }

    handle(req: RoutedHttpRequest): Promise<HttpResponse> {
        const notFoundHandler = this.notFound();
        const matchingHandler = this.matches(req.uri, req.method);
        if (matchingHandler) {
            Object.defineProperty(req, 'vars', {value: matchingHandler.vars})
            return matchingHandler.route.handler(req);
        } else {
            return notFoundHandler.handle(req);
        }
    }

    private matches(path: string, method: string): RouteMatch | undefined {
        for (const route of this.routes) {
            const matcher = route.matcher;
            if (matcher.method === method && matcher.uri !== undefined) {
                const match = this.match(route, path);
                if (match) return match;
            }
        }
    }

    private match(route: route<Method, string, any, HttpRequestHeaders, any>, path: string): RouteMatch | undefined {
        const matcher = route.matcher;
        const uri = URI.parse(path);
        const query = UrlEncodedMessage.parse(uri.query);
        const [pathMatcher, queryMatcher] = matcher.uri.split("?");
        const pathMatcherNoTrailingSlash = (pathMatcher !== '/' && pathMatcher.endsWith('/'))
            ? pathMatcher.slice(0, -1)
            : pathMatcher;
        const pathNoTrailingSlash = path !== "/" && path.endsWith('/') ? path.slice(0, -1) : path;
        const exactMatch = pathMatcherNoTrailingSlash === pathNoTrailingSlash;
        if (exactMatch) {
            return {route, vars: {path: {}, query, wildcards: [], fragment: uri.fragment?.slice(1)}}
        }
        return this.fuzzyMatch(pathMatcherNoTrailingSlash, queryMatcher, uri, path, route, query);
    }

    private fuzzyMatch(uriMatcher: string, matcherQuery: string, uri: Uri<string>, path: string, route: route<Method, string, any, HttpRequestHeaders, any>, query: queryObject<string>) {
        const pathMatchingRegex = this.regexToCaptureVars(uriMatcher);
        const mandatoryQueriesMatch = this.queriesMatch(matcherQuery, uri);
        const matches = pathMatchingRegex.test(path) && mandatoryQueriesMatch;
        if (matches) {
            const pathNoQuery = path.split("?")[0];
            const groups = pathNoQuery.match(pathMatchingRegex)!.groups as NodeJS.Dict<string>;
            if (groups) return {
                route, vars: this.populateVars(groups, query, uri.fragment?.slice(1))
            }
        }
    }

    private queriesMatch(matcherQuery: string | undefined, uri: Uri<string>): boolean {
        if (matcherQuery === undefined) return true;
        const queryMatching = matcherQuery.split("&").reduce((acc, next) => {
            if (next.includes("!")) {
                const withoutBang = next.replace("!", "");
                acc.push(new RegExp(`(?<query_${withoutBang}>${withoutBang}=[^&]+)`));
            }
            return acc;
        }, [] as RegExp[]);
        return queryMatching.every(m => m.exec(uri.query ?? '') !== null);
    }

    private regexToCaptureVars(uriMatcher: string) {
        // replace the path params with a regex capture
        let s = uriMatcher.replace(/\{(\w+)}/g, '(?<$1>[^\/]+)');
        // replace the wildcards with a regex capture
        for (const wildcard of s.split('*')) {
            s = s.replace('*', `(?<wildcard_${this.randomString(10)}>.{0,})`)
        }
        return new RegExp(s);
    }

    private populateVars(groups: NodeJS.Dict<string>, query: NodeJS.Dict<string>, fragment: string | undefined) {
        return Object.entries(groups).reduce((acc, [k, v]) => {
            if (k.startsWith('wildcard')) acc.wildcards.push(v!)
            else acc.path[k] = v!;
            return acc;
        }, ({
            wildcards: [] as string[],
            path: {} as { [k: string]: string },
            query: query,
            fragment
        }));
    }

    private notFound() {
        return {
            async handle(req: HttpRequest): Promise<HttpResponse<string>> {
                return Res.of({status: 404, body: "Not found"})
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

export type toQueryString<Qs> = Qs extends `${infer Q1}&${infer Q2}`
    ? `${Q1}=${string}&${toQueryString<Q2>}`
    : Qs extends `${infer Q1}`
        ? `${Q1}=${string}`
        : Qs;
export type pathPart<Part> = Part extends `${infer Start}?${infer Query}` ? Start : Part;
export type queryPart<Part> = Part extends `${infer Start}?${infer Query}` ? Query : '';
export type isPathParameter<Part> = Part extends `{${infer Name}}` ? Name : never;
export type pathParameters<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? isPathParameter<PartA> | pathParameters<PartB>
    : isPathParameter<Path>;
export type emptyToString<S extends string> = S extends '' ? string : S;
export type queriesFromString<Part> = Part extends `${infer Name}&${infer Rest}` ? Name | queriesFromString<Rest> : Part;
export type queryParameters<Path extends string> = Path extends ''
    ? { [key: string]: string }
    : toObj<queriesFromString<withoutFragment<Path>>>
export type getQueryKey<Part> = Part extends `${infer k}=${infer v}` ? k : never;
export type queryObject<Part> = toObj<getQueryKey<queriesFromString<Part>>>
export type toObj<union extends string> = {
    [Key in union]: string;
};
export type withoutFragment<Path> = Path extends `${infer PartA}#${infer PartB}` ? PartA : Path;
export type expandPathParameterOrWildcard<Part extends string> = Part extends `{${infer Name}}`
    ? `${string}/`
    : Part extends `*`
        ? string
        : `${Part}/`;
type backToPath<Path extends string> = Path extends `${infer PartA}/${infer PartB}`
    ? `${expandPathParameterOrWildcard<PartA>}${backToPath<PartB>}`
    : expandPathParameterOrWildcard<Path>;
export type fullPath<Part extends string> = Part extends `${infer Path}?${infer Query}`
    ? `${backToPath<Path>}?${toQueryString<Query>}`
    : backToPath<Part>;
