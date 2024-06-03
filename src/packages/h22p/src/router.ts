import {HttpHandler, HttpMessageBody, HttpRequest, HttpRequestHeaders, HttpResponse, Method} from "./interface";
import {Uri, URI} from "./uri";
import {UrlEncodedMessage} from "./urlEncodedMessage";
import {h22pStream} from "./body";
import {Res} from "./response";

export type routedHandler<
    Mtd extends Method,
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
> = (req: RoutedHttpRequest<Mtd, Uri, ReqB, ReqHds>) => Promise<Res>

export type handler<
    Mtd extends Method,
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
> = (req: HttpRequest<Mtd, expandUri<Uri>, ReqB, ReqHds>) => Promise<Res>

// this type is lowercase just so we can export class with the same name "Route" that has all our routing methods
export type RouteDefinition<
    Mtd extends Method,
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
> = {
    route: routedHandler<Mtd, Uri, ReqB, ReqHds, Res>,
    handle: handler<Mtd, Uri, ReqB, ReqHds, Res>,
    request: (mtd: Mtd, uri: expandUri<Uri>, body: ReqB, headers: ReqHds) => HttpRequest<Mtd, expandUri<Uri>, ReqB, ReqHds>
    matcher: HttpRequest<Mtd, Uri, ReqB, ReqHds>
    responses: Res[]
};

export type Routes<
    Mtd extends Method = Method,
    Uri extends string = string,
    ReqB extends HttpMessageBody = HttpMessageBody,
    ReqHds extends HttpRequestHeaders = HttpRequestHeaders,
    Res extends HttpResponse = HttpResponse> = {
    [name: string]: RouteDefinition<Mtd, Uri, ReqB, ReqHds, Res>
}

type StronglyTypedRoutedRequestVariables<Uri extends string = string> = {
    path: toObj<pathParameters<pathPart<Uri>>>
    query: queryParameters<queryPart<Uri>>
    fragment: string | undefined
    wildcards: string[]
};

export interface RoutedHttpRequest<
    Mtd extends Method = Method,
    Uri extends string = string,
    ReqB extends HttpMessageBody = any,
    ReqHds extends HttpRequestHeaders = HttpRequestHeaders,
> extends HttpRequest<Mtd, expandUri<Uri>, ReqB, ReqHds> {
    vars: StronglyTypedRoutedRequestVariables<Uri>
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
>(uri: Uri, handle: routedHandler<"GET", Uri, undefined, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<"GET", Uri, undefined, ReqHds, Res> {
    const matcher = {method: 'GET' as const, uri, body: undefined, headers: headers ?? {} as ReqHds};
    return {
        route: (req: RoutedHttpRequest<'GET', Uri, undefined, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)});
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req);
        },
        handle: (req: HttpRequest<'GET', expandUri<Uri>, undefined, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)});
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req as any as RoutedHttpRequest<'GET', Uri, undefined, ReqHds>);
        },
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher,
        responses: responses ?? []
    }
}

function head<
    Uri extends string,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
>(uri: Uri, handle: routedHandler<"HEAD", Uri, undefined, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<"HEAD", Uri, undefined, ReqHds, Res> {
    const matcher = {method: 'HEAD' as const, uri, body: undefined, headers: headers ?? {} as ReqHds};
    return {
        route: (req: RoutedHttpRequest<'HEAD', Uri, undefined, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            return handle(req);
        },
        handle: (req: HttpRequest<'HEAD', expandUri<Uri>, undefined, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)});
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req as any as RoutedHttpRequest<'HEAD', Uri, undefined, ReqHds>);
        },
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher,
        responses: responses ?? []
    }
}

function options<
    Uri extends string,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
>(uri: Uri, handle: routedHandler<"OPTIONS", Uri, undefined, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<"OPTIONS", Uri, undefined, ReqHds, Res> {
    const matcher = {method: 'OPTIONS' as const, uri, body: undefined, headers: headers ?? {} as ReqHds};
    return {
        route: (req: RoutedHttpRequest<'OPTIONS', Uri, undefined, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req);
        },
        handle: (req: HttpRequest<'OPTIONS', expandUri<Uri>, undefined, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)});
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req as any as RoutedHttpRequest<'OPTIONS', Uri, undefined, ReqHds>);
        },
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher,
        responses: responses ?? []
    }
}

function connect<
    Uri extends string,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
>(uri: Uri, handle: routedHandler<"CONNECT", Uri, undefined, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<"CONNECT", Uri, undefined, ReqHds, Res> {
    const matcher = {method: 'CONNECT' as const, uri, body: undefined, headers: headers ?? {} as ReqHds};
    return {
        route: (req: RoutedHttpRequest<'CONNECT', Uri, undefined, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req);
        },
        handle: (req: HttpRequest<'CONNECT', expandUri<Uri>, undefined, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)});
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req as any as RoutedHttpRequest<'CONNECT', Uri, undefined, ReqHds>);
        },
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher,
        responses: responses ?? []
    }
}

function trace<
    Uri extends string,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse
>(uri: Uri, handle: routedHandler<"TRACE", Uri, undefined, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<"TRACE", Uri, undefined, ReqHds, Res> {
    const matcher = {method: 'TRACE' as const, uri, body: undefined, headers: headers ?? {} as ReqHds};
    return {
        route: (req: RoutedHttpRequest<'TRACE', Uri, undefined, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req);
        },
        handle: (req: HttpRequest<'TRACE', expandUri<Uri>, undefined, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)});
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req as any as RoutedHttpRequest<'TRACE', Uri, undefined, ReqHds>);
        },
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher,
        responses: responses ?? []
    }
}

function post<
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse,
>(uri: Uri, body: ReqB, handle: routedHandler<'POST', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<'POST', Uri, ReqB, ReqHds, Res> {
    const matcher = {method: 'POST' as const, uri, body, headers: headers ?? {} as ReqHds};
    return {
        route: (req: RoutedHttpRequest<'POST', Uri, ReqB, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req);
        },
        handle: (req: HttpRequest<'POST', expandUri<Uri>, ReqB, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)});
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req as any as RoutedHttpRequest<'POST', Uri, ReqB, ReqHds>);
        },
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher,
        responses: responses ?? [],
    }
}

function put<
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse,
>(uri: Uri, body: ReqB, handle: routedHandler<'PUT', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<'PUT', Uri, ReqB, ReqHds, Res> {
    const matcher = {method: 'PUT' as const, uri, body, headers: headers ?? {} as ReqHds};
    return {
        route: (req: RoutedHttpRequest<'PUT', Uri, ReqB, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req);
        },
        handle: (req: HttpRequest<'PUT', expandUri<Uri>, ReqB, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)});
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req as any as RoutedHttpRequest<'PUT', Uri, ReqB, ReqHds>);
        },
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher,
        responses: responses ?? [],
    }
}

function patch<
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse,
>(uri: Uri, body: ReqB, handle: routedHandler<'PATCH', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<'PATCH', Uri, ReqB, ReqHds, Res> {
    const matcher = {method: 'PATCH' as const, uri, body, headers: headers ?? {} as ReqHds};
    return {
        route: (req: RoutedHttpRequest<'PATCH', Uri, ReqB, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req);
        },
        handle: (req: HttpRequest<'PATCH', expandUri<Uri>, ReqB, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)});
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req as any as RoutedHttpRequest<'PATCH', Uri, ReqB, ReqHds>);
        },
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher,
        responses: responses ?? [],
    }
}

function del<
    Uri extends string,
    ReqB extends HttpMessageBody,
    ReqHds extends HttpRequestHeaders,
    Res extends HttpResponse,
>(uri: Uri, body: ReqB, handle: routedHandler<'DELETE', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<'DELETE', Uri, ReqB, ReqHds, Res> {
    const matcher = {method: 'DELETE' as const, uri, body, headers: headers ?? {} as ReqHds};
    return {
        route: (req: RoutedHttpRequest<'DELETE', Uri, ReqB, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)})
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req);
        },
        handle: (req: HttpRequest<'DELETE', expandUri<Uri>, ReqB, ReqHds>) => {
            Object.defineProperty(req, 'body', {value: h22pStream.of(req.body)});
            Object.defineProperty(req, 'vars', {
                value: (RouteMatcher.match(matcher, req.uri) as PositiveRouteMatch).vars,
                configurable: true
            });
            return handle(req as any as RoutedHttpRequest<'DELETE', Uri, ReqB, ReqHds>);
        },
        request: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers}),
        matcher,
        responses: responses ?? [],
    }
}

type RoutedRequestVariables = {
    path: NodeJS.Dict<string>,
    query: NodeJS.Dict<string>,
    fragment: string | undefined,
    wildcards: string[]
};
type RouteAndMatch = {
    routeDefinition: RouteDefinition<Method, string, any, HttpRequestHeaders, any>,
    vars: RoutedRequestVariables
};
type PositiveRouteMatch = {
    matches: true
    vars: RoutedRequestVariables
};
type NegativeRouteMatch = { matches: false };
type RouteMatch = PositiveRouteMatch | NegativeRouteMatch

export class Router implements HttpHandler {
    constructor(public routes: RouteDefinition<Method, string, any, HttpRequestHeaders, any>[]) {
    }

    static of(routes: { [key: string]: RouteDefinition<any, any, any, any, any> }) {
        return new Router(Object.values(routes))
    }

    handle(req: HttpRequest): Promise<HttpResponse> {
        const notFoundHandler = this.notFound();
        const path = URI.parse(req.uri).path ?? '';
        const matchingHandler = this.matches(path, req.method);
        if (matchingHandler) {
            // convert to a routed http request by adding vars
            Object.defineProperty(req, 'vars', {value: matchingHandler.vars, configurable: true})
            return matchingHandler.routeDefinition.route(req as RoutedHttpRequest);
        } else {
            return notFoundHandler.handle(req);
        }
    }

    private matches(path: string, method: string): RouteAndMatch | undefined {
        for (const route of this.routes) {
            const matcher = route.matcher;
            if (matcher.method === method && matcher.uri !== undefined) {
                const match = RouteMatcher.match(route.matcher, path);
                if (match.matches) return {routeDefinition: route, vars: match.vars};
            }
        }
    }

    private notFound() {
        return {
            async handle(req: HttpRequest): Promise<HttpResponse<string>> {
                return Res.of({status: 404, body: "Not found"})
            }
        };
    }

}

class RouteMatcher {
    static match(matcher: HttpRequest, path: string): RouteMatch {
        const uri = URI.parse(path);
        const query = UrlEncodedMessage.parse(uri.query);
        const [pathMatcher, queryMatcher] = matcher.uri.split("?");
        const pathMatcherNoTrailingSlash = (pathMatcher !== '/' && pathMatcher.endsWith('/'))
            ? pathMatcher.slice(0, -1)
            : pathMatcher;
        const pathNoTrailingSlash = path !== "/" && path.endsWith('/') ? path.slice(0, -1) : path;
        const exactMatch = pathMatcherNoTrailingSlash === pathNoTrailingSlash;
        if (exactMatch) {
            return {matches: true, vars: {path: {}, query, wildcards: [], fragment: uri.fragment?.slice(1)}}
        }
        return this.fuzzyMatch(pathMatcherNoTrailingSlash, queryMatcher, uri, path, query);
    }

    private static fuzzyMatch(
        uriMatcher: string,
        matcherQuery: string,
        uri: Uri<string>,
        path: string,
        query: queryObject<string>
    ): RouteMatch {
        const pathMatchingRegex = this.regexToCaptureVars(uriMatcher);
        const mandatoryQueriesMatch = this.queriesMatch(matcherQuery, uri);
        const matches = pathMatchingRegex.test(path) && mandatoryQueriesMatch;
        if (matches) {
            const pathNoQuery = path.split("?")[0];
            const groups = pathNoQuery.match(pathMatchingRegex)!.groups as NodeJS.Dict<string>;
            if (groups) {
                return {
                    matches: true,
                    vars: this.populateVars(groups, query, uri.fragment?.slice(1))
                }
            } else {
                return {matches: false}
            }
        }
        return {matches: false}
    }

    private static queriesMatch(matcherQuery: string | undefined, uri: Uri<string>): boolean {
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

    private static regexToCaptureVars(uriMatcher: string) {
        // replace the path params with a regex capture
        let s = uriMatcher.replace(/\{(\w+)}/g, '(?<$1>[^\/]+)');
        // replace the wildcards with a regex capture
        for (const wildcard of s.split('*')) {
            s = s.replace('*', `(?<wildcard_${this.randomString(10)}>.{0,})`)
        }
        return new RegExp(s);
    }

    private static populateVars(groups: NodeJS.Dict<string>, query: NodeJS.Dict<string>, fragment: string | undefined) {
        return Object.entries(groups).reduce((acc, [k, v]) => {
            if (k.startsWith('wildcard')) acc.wildcards.push(v!.endsWith("/") ? v!.slice(0, -1) : v!)
            else acc.path[k] = v!;
            return acc;
        }, ({
            wildcards: [] as string[],
            path: {} as { [k: string]: string },
            query: query,
            fragment
        }));
    }

    private static randomString(length: number): string {
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
export type expandUri<Part extends string> = Part extends `${infer Path}?${infer Query}`
    ? `${backToPath<Path>}?${toQueryString<Query>}`
    : backToPath<Part>;
