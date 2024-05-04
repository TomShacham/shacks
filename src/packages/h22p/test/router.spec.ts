import {expect} from "chai";
import {Body, contractFrom, h22p, post, route, Router, router} from "../src";

describe('router', () => {
    it('not found default', async () => {
        const router = new Router([
            route("GET", "/", async (req) => {
                return h22p.response({status: 200, body: `Hello`})
            })]);
        const res = await router.handle(h22p.request({method: 'GET', path: '/not/found'}))
        expect(res.status).eq(404);
        expect(res.body).eq('Not found');
    })

    it('simple route', async () => {
        const router = new Router([
            route("GET", "/", async (req) => {
                return h22p.response({status: 200, body: `Hello`})
            })]);
        const res = await router.handle(h22p.request({method: 'GET', path: '/'}))
        expect(res.status).eq(200);
        expect(res.body).eq('Hello');
    })

    it('path param', async () => {
        const router = new Router([
            route('GET', "/resource/{id}/sub/{subId}", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${params.id} ${params.subId}`})
            })
        ]);
        const res = await router.handle(h22p.get('/resource/123/sub/456'))
        expect(res.status).eq(200);
        expect(res.body).eq('Hello 123 456');
    })

    it('wildcard without path params', async () => {
        const router = new Router([
            route('GET', "*/resource/*", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${req.vars.wildcards.join('::')}`})
            })
        ]);
        const res = await router.handle(h22p.get('bingo/bongo/resource/hanky/panky'))
        expect(res.status).eq(200);
        expect(res.body).eq('Hello bingo/bongo::hanky/panky');
    })

    it('wildcard with path params', async () => {
        const router = new Router([
            route('GET', "*/resource/{id}/sub/{subId}/*", async (req) => {
                const params = req.vars.path;
                return h22p.response({
                    status: 200,
                    body: `Hello ${req.vars.wildcards.join('::')} ${params.id} ${params.subId}`
                })
            })
        ]);
        const res = await router.handle(h22p.get('bingo/bongo/resource/123/sub/456/hanky/panky'))
        expect(res.status).eq(200);
        expect(res.body).eq('Hello bingo/bongo::hanky/panky 123 456');
    })

    it('trailing slash in route path is ignored', async () => {
        const router = new Router([
            route('GET', "/resource/{id}/", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${params.id}`})
            })
        ]);
        const res = await router.handle(h22p.get('/resource/123'))
        expect(res.status).eq(200);
        expect(res.body).eq('Hello 123');
    })

    it('trailing slash in req path is ignored', async () => {
        const router = new Router([
            route('GET', "/resource/{id}", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${params.id}`})
            })
        ]);
        const res = await router.handle(h22p.get('/resource/123/'))
        expect(res.status).eq(200);
        expect(res.body).eq('Hello 123');
    })

    it('can generate a client from router', async () => {
        const routing = {
            getRoute: route('GET', "/resource/{id}/sub/{subId}", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${params.id} ${params.subId}`})
            }),
            postRoute: post<{ foo: string }>()('POST', "/resource/{id}", async (req) => {
                const params = req.vars.path;
                // TODO this should not give you req.body.foo until after Body.json()
                const body = await Body.json(req.body)
                return h22p.response({status: 200, body: `Hello ${params.id} ${body.foo}`})
            })
        };

        const {port, close} = await h22p.server(router(routing))
        const contract = contractFrom(routing)

        const getRoute = contract.getRoute({id: 'id-123', subId: 'sub-456'});
        const postRoute = contract.postRoute({id: 'id-123'}, {foo: 'body-456'});
        const getResponse = await h22p.client(`http://localhost:${port}`).handle(getRoute);
        const postResponse = await h22p.client(`http://localhost:${port}`).handle(postRoute);

        expect(getResponse.status).eq(200);
        expect(postResponse.status).eq(200);
        expect(await Body.text(getResponse.body!)).eq('Hello id-123 sub-456');
        expect(await Body.text(postResponse.body!)).eq('Hello id-123 body-456');

        await close();
    })
})
