import {H22P, HttpHandler, HttpRequest, HttpResponse, Method, TypedHttpRequest} from "./interface";

type Route<S extends string> = {
    path: S;
    handler: { handle(req: TypedHttpRequest<S>): Promise<HttpResponse> };
    method: string
};

export class Router implements HttpHandler {
    constructor(public routes: Route<string>[]) {
    }

    handle(req: HttpRequest): Promise<HttpResponse> {
        const notFoundHandler = {
            async handle(req: HttpRequest): Promise<HttpResponse> {
                return H22P.response({status: 404, body: "Not found"})
            }
        };
        const apiHandler = this.matches(req.path, req.method);
        if (apiHandler.route) {
            const typedReq = {...req, vars: {path: apiHandler.matches}}
            return apiHandler.route.handler.handle(typedReq);
        } else {
            return notFoundHandler.handle(req);
        }
    }

    private matches(path: string, method: string): { route?: Route<string>, matches: NodeJS.Dict<string> } {
        for (const route of this.routes) {
            const exactMatch = route.path === path && route.method === method;
            if (exactMatch) return {route, matches: {}}
            const regExp = new RegExp(route.path.replaceAll(/\{(\w+)}/g, '(?<$1>[^\/]+)'));
            const regExpMatches = regExp.test(path);
            if (regExpMatches) {
                const matches = path.match(regExp)!.groups as NodeJS.Dict<string>;
                if (matches) return {route, matches}
            }
        }
        return {matches: {}}
    }

}

export function route<S extends string>(method: Method, path: S, handler: (req: TypedHttpRequest<S>) => Promise<HttpResponse>): Route<S> {
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