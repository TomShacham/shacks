import {expect} from "chai";
import {Body, contractFrom, h22p, read, Router, router, write} from "../src";
import stream from "node:stream";

describe('router', () => {
    it('not found default', async () => {
        const router = new Router([
            read("GET", "/", async (req) => {
                return h22p.response({status: 200, body: `Hello`})
            })]);
        const res = await router.handle(h22p.request({method: 'GET', path: '/not/found'}))
        expect(res.status).eq(404);
        expect(res.body).eq('Not found');
    })

    it('simple route', async () => {
        const router = new Router([
            read("GET", "/", async (req) => {
                return h22p.response({status: 200, body: `Hello`})
            })]);
        const res = await router.handle(h22p.request({method: 'GET', path: '/'}))
        expect(res.status).eq(200);
        expect(res.body).eq('Hello');
    })

    it('path param', async () => {
        const router = new Router([
            read('GET', "/resource/{id}/sub/{subId}", async (req) => {
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
            read('GET', "*/resource/*", async (req) => {
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
            read('GET', "*/resource/{id}/sub/{subId}/*", async (req) => {
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
            read('GET', "/resource/{id}/", async (req) => {
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
            read('GET', "/resource/{id}", async (req) => {
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
            getRoute: read('GET', "/resource/{id}/sub/{subId}", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${params.id} ${params.subId}`})
            }),
            jsonRoute: write<{ foo: string }>()('POST', "/resource/{id}", async (req) => {
                const params = req.vars.path;
                const body = await Body.json(req.body);
                return h22p.response({status: 200, body: `Hello ${params.id} ${body.foo}`})
            }),
            streamRoute: write<stream.Readable>()('PUT', "/resource/{id}", async (req) => {
                const params = req.vars.path;
                const body = await Body.text(req.body);
                return h22p.response({status: 200, body: `Hello ${params.id} ${body}`})
            }),
            stringRoute: write<string>()('PATCH', "/resource/{id}", async (req) => {
                const params = req.vars.path;
                const body = await Body.text(req.body);
                return h22p.response({status: 200, body: `Hello ${params.id} ${body.length} chars`})
            })
        };

        // over the wire we always have a stream,
        //      otherwise we have T : HttpMessageBody<B>
        //      I want route to always provide a h22pStream<B>
        // I want Body.text / json to be able to handle any kind of HttpMessageBody
        //I want client and server to be able to handle any kind of HttpMessageBody too
        // server should always return a node stream
        // client should return

        /// TODO unify the in memory and over the wire routing

        const {port, close} = await h22p.server(router(routing))
        const contract = contractFrom(routing)

        const getRoute = contract.getRoute({id: 'id-123', subId: 'sub-456'});
        const getResponse = await h22p.client(`http://localhost:${port}`).handle(getRoute);

        const postRoute = contract.jsonRoute({id: 'id-123'}, {foo: 'body-456'});
        const postResponse = await h22p.client(`http://localhost:${port}`).handle(postRoute);

        const streamRoute = contract.streamRoute({id: 'id-123'}, stream.Readable.from('stream-123'));
        const streamRouteResponse = await h22p.client(`http://localhost:${port}`).handle(streamRoute);

        const stringRoute = contract.stringRoute({id: 'id-123'}, 'string-123');
        const stringRouteResponse = await h22p.client(`http://localhost:${port}`).handle(stringRoute);

        expect(getResponse.status).eq(200);
        expect(await Body.text(getResponse.body!)).eq('Hello id-123 sub-456');
        expect(postResponse.status).eq(200);
        expect(await Body.text(postResponse.body!)).eq('Hello id-123 body-456');
        expect(streamRouteResponse.status).eq(200);
        expect(await Body.text(streamRouteResponse.body!)).eq('Hello id-123 stream-123');
        expect(stringRouteResponse.status).eq(200);
        expect(await Body.text(stringRouteResponse.body!)).eq('Hello id-123 10 chars');

        await close();
    })
})
