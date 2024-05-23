import {h22p, HttpHandler, HttpMessageBody, HttpRequest, HttpRequestHeaders, HttpResponse, Method} from "./interface";
import {URI} from "./uri";
import {UrlEncodedMessage} from "./urlEncodedMessage";
import {h22pStream} from "./body";

export type toQueryString<Qs> = Qs extends `${infer Q1}&${infer Q2}`
    ? `${Q1}=${string}&${toQueryString<Q2>}`
    : Qs extends `${infer Q1}`
        ? `${Q1}=${string}`
        : Qs;
export type pathPart<Part> = Part extends `${infer Start}?${infer Query}` ? Start : '';
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
export type expandPathParameterOrWildcard<Part> = Part extends `{${infer Name}}`
    ? string
    : Part extends `*`
        ? string
        : Part;
type backToPath<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? `${expandPathParameterOrWildcard<PartA>}/${backToPath<PartB>}`
    : expandPathParameterOrWildcard<Path>;
export type fullPath<Part> = Part extends `${infer Path}?${infer Query}`
    ? `${backToPath<Path>}?${toQueryString<Query>}`
    : backToPath<Part>;

export type handler<
    Mtd extends Method,
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
> = {
    handle: (req: RoutedHttpRequest<Mtd, Uri, ReqB, ReqHds>) => Promise<Res>
}
export type Route<
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

export class route {
    static get = get;
    static post = post;
}

export function get<
    Uri extends string,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
>(uri: Uri, handler: handler<"GET", Uri, undefined, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : Route<"GET", Uri, undefined, ReqHds, Res> {
    return {
        handler: {
            handle: (req: RoutedHttpRequest<'GET', Uri, undefined, ReqHds>) => {
                Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
                return handler.handle(req);
            }
        },
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher: ({method: 'GET', uri, body: undefined, headers: headers ?? {} as ReqHds}),
        responses: responses ?? []
    }
}

export function post<
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse,
>(uri: Uri, body: ReqB, handler: handler<'POST', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : Route<'POST', Uri, ReqB, ReqHds, Res> {
    return {
        handler: {
            handle: (req: RoutedHttpRequest<'POST', Uri, ReqB, ReqHds>) => {
                Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
                return handler.handle(req);
            }
        },
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher: ({method: 'POST', uri, body, headers: headers ?? {} as ReqHds}),
        responses: responses ?? [],
    }
}

export class Router implements HttpHandler {
    constructor(public routes: Route<Method, string, any, HttpRequestHeaders, any>[]) {
    }

    handle(req: RoutedHttpRequest): Promise<HttpResponse> {
        const notFoundHandler = this.notFound();
        const matchingHandler = this.matches(req.uri, req.method);
        if (matchingHandler.route) {
            Object.defineProperty(req, 'vars', {value: matchingHandler.vars})
            return matchingHandler.route.handler.handle(req);
        } else {
            return notFoundHandler.handle(req);
        }
    }

    private matches(path: string, method: string): {
        route?: Route<Method, string, any, HttpRequestHeaders, any>,
        vars: {
            path: NodeJS.Dict<string>,
            query: NodeJS.Dict<string>,
            fragment: string | undefined,
            wildcards: string[]
        }
    } {
        for (const route of this.routes) {
            const matcher = route.matcher;
            if (matcher.method === method && matcher.uri !== undefined) {
                const uri = URI.parse(path);
                const query = UrlEncodedMessage.parse(uri.query);
                const noQuery = matcher.uri.split("?")[0];
                const noTrailingSlash = (noQuery !== '/' && noQuery.endsWith('/')) ? noQuery.slice(0, -1) : noQuery;
                const exactMatch = noTrailingSlash === path;
                if (exactMatch) return {route, vars: {path: {}, query, wildcards: [], fragment: uri.fragment?.slice(1)}}
                const regex = this.regexCapturingVars(noTrailingSlash);
                const pathNoQuery = path.split("?")[0];
                const matches = regex.test(pathNoQuery);
                if (matches) {
                    const groups = pathNoQuery.match(regex)!.groups as NodeJS.Dict<string>;
                    if (groups) return {
                        route, vars: this.populateVars(groups, query, uri.fragment?.slice(1))

                    }
                }
            }
        }
        return {vars: {path: {}, query: {}, wildcards: [], fragment: undefined}}
    }

    private regexCapturingVars(noTrailingSlash: string) {
        let s = noTrailingSlash.replaceAll(/\{(\w+)}/g, '(?<$1>[^\/]+)');
        for (const wildcard of s.split('*')) {
            s = s.replace('*', `(?<wildcard_${this.randomString(10)}>.+)`)
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

export function router(routes: { [key: string]: Route<any, any, any, any, any> }) {
    return new Router(Object.values(routes))
}