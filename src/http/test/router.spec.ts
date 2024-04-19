import {HttpHandler, Req, request, Res, response} from "../src/interface";
import {expect} from "chai";

type Route = { path: string; handler: { handle(req: Req): Promise<Res> }; method: string };

class Router implements HttpHandler {
    constructor(public routes: Route[]) {
    }

    handle(req: Req<string>): Promise<Res<string>> {
        const notFoundHandler = {
            async handle(req: Req): Promise<Res> {
                return response({status: 404, body: "Not found"})
            }
        };
        const apiHandler = this.routes.find(it => it.path === req.path && it.method === req.method)?.handler;
        const handler = apiHandler ?? notFoundHandler;
        return handler.handle(req);
    }

}

describe('router', () => {
    it('simple route', async () => {
        const router = new Router([{
            path: "/",
            method: "GET",
            handler: {
                async handle(req: Req): Promise<Res> {
                    return response({status: 200, body: 'Hello'})
                }
            }
        }]);
        const res = await router.handle(request({method: 'GET', path: '/'}))
        expect(res.status).eq(200);
        expect(res.body).eq('Hello');
    })

    it('path param', async () => {
        const router = new Router([{
            path: "/resource/{id}",
            method: "GET",
            handler: {
                async handle(req: Req): Promise<Res> {
                    return response({status: 200, body: 'Hello'})
                }
            }
        }]);
        const res = await router.handle(request({method: 'GET', path: '/resource/123'}))
        expect(res.status).eq(200);
        expect(res.body).eq('Hello 123');
    })
})