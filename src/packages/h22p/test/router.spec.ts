import {expect} from "chai";
import {Body, contractFrom, h22p, h22pStream, read, router, Router, write} from "../src";
import stream from "node:stream";

describe('router', () => {
    it('not found default', async () => {
        const router = new Router([
            read()("GET", "/", async (req) => {
                return h22p.response({status: 200, body: `Hello`})
            })]);
        const res = await router.handle(h22p.request({method: 'GET', path: '/not/found'}))
        expect(res.status).eq(404);
        expect(await Body.text(res.body)).eq('Not found');
    })

    it('simple route', async () => {
        const router = new Router([
            read()("GET", "/", async (req) => {
                return h22p.response({status: 200, body: `Hello`})
            })]);
        const res = await router.handle(h22p.request({method: 'GET', path: '/'}))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello');
    })

    it('path param', async () => {
        const router = new Router([
            read()('GET', "/resource/{id}/sub/{subId}", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${params.id} ${params.subId}`})
            })
        ]);
        const res = await router.handle(h22p.get('/resource/123/sub/456'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello 123 456');
    })

    it('wildcard without path params', async () => {
        const router = new Router([
            read()('GET', "*/resource/*", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${req.vars.wildcards.join('::')}`})
            })
        ]);
        const res = await router.handle(h22p.get('bingo/bongo/resource/hanky/panky'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello bingo/bongo::hanky/panky');
    })

    it('wildcard with path params', async () => {
        const router = new Router([
            read()('GET', "*/resource/{id}/sub/{subId}/*", async (req) => {
                const params = req.vars.path;
                return h22p.response({
                    status: 200,
                    body: `Hello ${req.vars.wildcards.join('::')} ${params.id} ${params.subId}`
                })
            })
        ]);
        const res = await router.handle(h22p.get('bingo/bongo/resource/123/sub/456/hanky/panky'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello bingo/bongo::hanky/panky 123 456');
    })

    it('trailing slash in route path is ignored', async () => {
        const router = new Router([
            read()('GET', "/resource/{id}/", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${params.id}`})
            })
        ]);
        const res = await router.handle(h22p.get('/resource/123'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello 123');
    })

    it('trailing slash in req path is ignored', async () => {
        const router = new Router([
            read()('GET', "/resource/{id}", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${params.id}`})
            })
        ]);
        const res = await router.handle(h22p.get('/resource/123/'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello 123');
    })

    it('can generate a client from router', async () => {
        const routing = {
            readRoute: read<string, { h1: string }>()('GET', "/resource/{id}/sub/{subId}", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${params.id} ${params.subId}`})
            }),
            jsonRoute: write<
                { foo: string },
                string | { foo: string },
                { h2: string }
            >()('POST', "/resource/{id}", async (req) => {
                const params = req.vars.path;
                const body = await Body.json(req.body);
                if (req.vars.path.id === 'id-123') {
                    return h22p.response({status: 200, body: `Hello ${params.id} ${body.foo}`})
                } else {
                    return h22p.response({status: 400, body: {foo: '123'}})
                }
            }),
            streamRoute: write<stream.Readable, any, { h3: string[] }>()('PUT', "/resource/{id}", async (req) => {
                const params = req.vars.path;
                const body = await Body.text(req.body);
                // body has no type here, it's just a stream
                //   but if you know what the type will be then use an h22pStream like below
                return h22p.response({status: 200, body: `Hello ${params.id} ${body}`})
            }),
            h22pStreamRoute: write<h22pStream<{ foo: string }>>()('PUT', "/resource/{id}", async (req) => {
                const params = req.vars.path;
                const body = await Body.json(req.body);
                return h22p.response({status: 200, body: `Hello ${params.id} ${body.foo}`})
            }),
            stringRoute: write<string>()('PATCH', "/resource/{id}", async (req) => {
                const params = req.vars.path;
                const body = await Body.text(req.body);
                return h22p.response({status: 200, body: `Hello ${params.id} ${body.length} chars`})
            })
        };

        const {port, close} = await h22p.server(router(routing));
        const contract = contractFrom(routing);

        const readRoute = contract.readRoute({id: 'id-123', subId: 'sub-456'}, {h1: 'foo'});
        const readResponse = await h22p.client(`http://localhost:${port}`).handle(readRoute);

        const jsonRoute = contract.jsonRoute({id: 'id-123'}, {foo: 'body-456'}, {h2: 'thing'});
        const jsonResponse = await h22p.client(`http://localhost:${port}`).handle(jsonRoute);

        const streamRoute = contract.streamRoute({id: 'id-123'}, stream.Readable.from('stream-123'), {h3: ['foo']});
        const streamRouteResponse = await h22p.client(`http://localhost:${port}`).handle(streamRoute);

        const h22pStreamRouteRoute = contract.h22pStreamRoute({id: 'id-123'}, {foo: '123'});
        const h22pStreamRouteRouteResponse = await h22p.client(`http://localhost:${port}`).handle(h22pStreamRouteRoute);

        const stringRoute = contract.stringRoute({id: 'id-123'}, 'string-123');
        const stringRouteResponse = await h22p.client(`http://localhost:${port}`).handle(stringRoute);

        const stringRouteInMemory = contract.stringRoute({id: 'id-123'}, 'string-123',);
        // the in memory handler (ie routing.stringRoute.handler) receives an h22pStream just like over the wire
        const stringRouteResponseInMemory = await routing.stringRoute.handler.handle(stringRouteInMemory);

        // TODO query parameters

        expect(readResponse.status).eq(200);
        expect(await Body.text(readResponse.body!)).eq('Hello id-123 sub-456');
        expect(jsonResponse.status).eq(200);
        expect(await Body.text(jsonResponse.body!)).eq('Hello id-123 body-456');
        expect(streamRouteResponse.status).eq(200);
        expect(await Body.text(streamRouteResponse.body!)).eq('Hello id-123 stream-123');
        expect(h22pStreamRouteRouteResponse.status).eq(200);
        expect(await Body.text(h22pStreamRouteRouteResponse.body!)).eq('Hello id-123 {"foo":"123"}');
        expect(stringRouteResponse.status).eq(200);
        expect(await Body.text(stringRouteResponse.body!)).eq('Hello id-123 10 chars');

        // in memory is the same contract
        expect(stringRouteResponse.status).eq(200);
        expect(await Body.text(stringRouteResponseInMemory.body!)).eq('Hello id-123 10 chars');

        await close();

        /*
            The client and server both give you a node stream
            but routing always has an h22pStream in the middle
            thanks to read and write methods

            use Body.text and Body.json to handle any type in-between
         */
    })
})
