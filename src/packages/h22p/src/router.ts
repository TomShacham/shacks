import {h22p, HttpHandler, HttpRequest, HttpRequestHeaders, HttpResponse, Method} from "./interface";
import {URI} from "./uri";
import {UrlEncodedMessage} from "./urlEncodedMessage";
import {Route} from "../test/router3.spec";

export class Router implements HttpHandler {
    constructor(public routes: Route<Method, string, any, HttpRequestHeaders, any>[]) {
    }

    handle(req: HttpRequest): Promise<HttpResponse> {
        const notFoundHandler = this.notFound();
        const matchingHandler = this.matches(req.uri, req.method);
        if (matchingHandler.route) {
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
            const matcher = route._req;
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