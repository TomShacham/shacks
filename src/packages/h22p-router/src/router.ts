import {
    expandUri,
    h22pStream,
    HttpHandler,
    HttpMessageBody,
    HttpRequest,
    HttpRequestHeaders,
    HttpResponse,
    Method,
    pathParameters,
    pathPart,
    queryObject,
    queryParameters,
    queryPart,
    Res,
    toObj,
    Uri,
    URI,
    UrlEncodedMessage
} from "@shacks/h22p";

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
>(uri: Uri, handle: routedHandler<'POST', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<'POST', Uri, ReqB, ReqHds, Res> {
    const matcher = {method: 'POST' as const, body: 'any' as any, uri, headers: headers ?? {} as ReqHds};
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
>(uri: Uri, handle: routedHandler<'PUT', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<'PUT', Uri, ReqB, ReqHds, Res> {
    const matcher = {method: 'PUT' as const, uri, body: 'any' as any, headers: headers ?? {} as ReqHds};
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
>(uri: Uri, handle: routedHandler<'PATCH', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<'PATCH', Uri, ReqB, ReqHds, Res> {
    const matcher = {method: 'PATCH' as const, uri, body: 'any' as any, headers: headers ?? {} as ReqHds};
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
>(uri: Uri, handle: routedHandler<'DELETE', Uri, ReqB, ReqHds, Res>, headers?: ReqHds, responses?: Res[])
    : RouteDefinition<'DELETE', Uri, ReqB, ReqHds, Res> {
    const matcher = {method: 'DELETE' as const, uri, body:'any' as any, headers: headers ?? {} as ReqHds};
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
        const matchingHandler = this.match(req.uri, req.method);
        if (matchingHandler) {
            // convert to a routed http request by adding vars
            Object.defineProperty(req, 'vars', {value: matchingHandler.vars, configurable: true})
            return matchingHandler.routeDefinition.route(req as RoutedHttpRequest);
        } else {
            return notFoundHandler.handle(req);
        }
    }

    private match(uri: string, method: string): RouteAndMatch | undefined {
        for (const route of this.routes) {
            const matcher = route.matcher;
            if (matcher.method === method && matcher.uri !== undefined) {
                const match = RouteMatcher.match(route.matcher, uri);
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
    static match(matcher: HttpRequest, uriString: string): RouteMatch {
        const uri = URI.parse(uriString);
        const path = uri.path ?? '/';
        const query = uri.query ?? '';
        const queryObj = UrlEncodedMessage.parse(uri.query);
        const [pathMatcher, queryMatcher] = matcher.uri.split("?");
        const pathMatcherNoTrailingSlash = (pathMatcher !== '/' && pathMatcher.endsWith('/'))
            ? pathMatcher.slice(0, -1)
            : pathMatcher;
        const pathNoTrailingSlash = path !== "/" && path.endsWith('/') ? path.slice(0, -1) : path;
        const exactMatch = pathMatcherNoTrailingSlash === pathNoTrailingSlash;
        if (exactMatch) {
            return {matches: true, vars: {path: {}, query: queryObj, wildcards: [], fragment: uri.fragment?.slice(1)}}
        }
        return this.fuzzyMatch(pathMatcherNoTrailingSlash, queryMatcher, uri, path, query, queryObj);
    }

    private static fuzzyMatch(
        uriMatcher: string,
        queryMatcher: string,
        uri: Uri<string>,
        path: string,
        query: string,
        queryObj: queryObject<string>
    ): RouteMatch {
        const pathMatchingRegex = this.regexToCaptureVars(uriMatcher);
        const mandatoryQueriesMatch = this.queriesMatch(queryMatcher, query);
        const matches = pathMatchingRegex.test(path) && mandatoryQueriesMatch;
        if (matches) {
            const pathNoQuery = path.split("?")[0];
            const groups = pathNoQuery.match(pathMatchingRegex)!.groups as NodeJS.Dict<string>;
            if (groups) {
                return {
                    matches: true,
                    vars: this.populateVars(groups, queryObj, uri.fragment?.slice(1))
                }
            } else {
                return {matches: false}
            }
        }
        return {matches: false}
    }

    private static queriesMatch(matcherQuery: string | undefined, query: string): boolean {
        if (matcherQuery === undefined) return true;
        const queryMatching = matcherQuery.split("&").reduce((acc, next) => {
            if (next.includes("!")) {
                const withoutBang = next.replace("!", "");
                acc.push(new RegExp(`(?<query_${withoutBang}>${withoutBang}=[^&]+)`));
            }
            return acc;
        }, [] as RegExp[]);
        return queryMatching.every(m => m.exec(query ?? '') !== null);
    }

    private static regexToCaptureVars(uriMatcher: string) {
        // replace the path params with a regex capture
        let withCaptures = uriMatcher.replace(/\{(\w+)}/g, '(?<$1>[^\/]+)');
        // replace the wildcards with a regex capture
        for (const wildcard of withCaptures.split('*')) {
            withCaptures = withCaptures.replace('*', `(?<wildcard_${this.randomString(10)}>.{0,})`)
        }
        const optionalEndingSlash = "\/?";
        const withStartAndEnd = "^" + withCaptures + optionalEndingSlash +  "$";
        return new RegExp(withStartAndEnd);
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


