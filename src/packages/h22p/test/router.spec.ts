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

    it('wildcard in path', async () => {
        const router = new Router([
            read()('GET', "*/resource/*", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${req.vars.wildcards.join(' ')}`})
            })
        ]);
        const res = await router.handle(h22p.get('bingo/bongo/resource/hanky/panky'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello bingo/bongo hanky/panky');
    })

    it('wildcard in middle of path', async () => {
        const router = new Router([
            read()('GET', "*/resource/*/more", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello ${req.vars.wildcards.join(' ')} more`})
            })
        ]);
        const res = await router.handle(h22p.get('bingo/bongo/resource/hanky/panky/tinky/tanky/more'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello bingo/bongo hanky/panky/tinky/tanky more');
    })

    it('wildcard with path params', async () => {
        const router = new Router([
            read()('GET', "*/resource/{id}/sub/{subId}/*", async (req) => {
                const params = req.vars.path;
                return h22p.response({
                    status: 200,
                    body: `Hello ${req.vars.wildcards.join(' ')} ${params.id} ${params.subId}`
                })
            })
        ]);
        const res = await router.handle(h22p.get('bingo/bongo/resource/123/sub/456/hanky/panky'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello bingo/bongo hanky/panky 123 456');
    })

    it('wildcard with path params and query params', async () => {
        const router = new Router([
            read()('GET', "*/resource/{id}/sub/{subId}/*?q1&q2", async (req) => {
                const pathParams = req.vars.path;
                const queryParams = req.vars.query;
                const wilcards = req.vars.wildcards.join(' ');
                return h22p.response({
                    status: 200,
                    body: `Hello ${wilcards} ${pathParams.id} ${pathParams.subId} ${queryParams.q1} ${queryParams.q2}`
                })
            })
        ]);
        const res = await router.handle(h22p.get('bingo/bongo/resource/123/sub/456/hanky/panky?q1=v1&q2=v2'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello bingo/bongo hanky/panky 123 456 v1 v2');
    })

    it('matches if a fragment is expected but not provided', async () => {
        const router = new Router([
            read()('GET', "*/resource/{id}/sub/{subId}/*?q1&q2#fragment", async (req) => {
                const pathParams = req.vars.path;
                const queryParams = req.vars.query;
                const wildcards = req.vars.wildcards.join(' ');
                const fragment = req.vars.fragment
                return h22p.response({
                    status: 200,
                    body: `Hello ${wildcards} ${pathParams.id} ${pathParams.subId} ${queryParams.q1} ${queryParams.q2}`
                })
            })
        ]);
        const res = await router.handle(h22p.get('bingo/bongo/resource/123/sub/456/hanky/panky?q1=v1&q2=v2'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello bingo/bongo hanky/panky 123 456 v1 v2');
    })

    it('wildcard with path params and query params and fragment', async () => {
        const router = new Router([
            read()('GET', "*/resource/{id}/sub/{subId}/*?q1&q2", async (req) => {
                const pathParams = req.vars.path;
                const queryParams = req.vars.query;
                const wildcards = req.vars.wildcards.join(' ');
                const fragment = req.vars.fragment
                return h22p.response({
                    status: 200,
                    body: `Hello ${wildcards} ${pathParams.id} ${pathParams.subId} ${queryParams.q1} ${queryParams.q2} ${fragment}`
                })
            })
        ]);
        const res = await router.handle(h22p.get('bingo/bongo/resource/123/sub/456/hanky/panky?q1=v1&q2=v2#frag'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello bingo/bongo hanky/panky 123 456 v1 v2 frag');
    })

    it('query params dont have to be there for the route to match', async () => {
        const router = new Router([
            read()('GET', "*/resource/{id}/sub/{subId}/*?q1&q2", async (req) => {
                const pathParams = req.vars.path;
                const queryParams = req.vars.query;
                const wilcards = req.vars.wildcards.join(' ');
                return h22p.response({
                    status: 200,
                    body: `Hello ${wilcards} ${pathParams.id} ${pathParams.subId} ${queryParams.q1} ${queryParams.q2}`
                })
            })
        ]);
        const res = await router.handle(h22p.get('bingo/bongo/resource/123/sub/456/hanky/panky?q1=v1'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello bingo/bongo hanky/panky 123 456 v1 undefined');
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

    it('routing precedence - matches first route that matches', async () => {
        // Object.values does not guarantee ordering, but generally it is ordered (by implementations)
        const routes = router({
            foo:
                read()('GET', "/resource/{id}", async (req) => {
                    const params = req.vars.path;
                    return h22p.response({status: 200, body: `Hello ${params.id}`})
                }),
            bar: read()('GET', "/resource/{id}", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello 456`})
            })
        });
        const res = await routes.handle(h22p.get('/resource/123/'))
        expect(res.status).eq(200);
        // we do not get Hello 456
        expect(await Body.text(res.body)).eq('Hello 123');
    })

    it('combining routes - precedence is in the order you pass them in', async () => {
        // Object.values does not guarantee ordering, but generally it is ordered (by implementations)
        const barRoute = {
            bar: read()('GET', "/resource/{id}", async (req) => {
                const params = req.vars.path;
                return h22p.response({status: 200, body: `Hello 456`})
            })
        };
        const fooRoute = {
            foo:
                read()('GET', "/resource/{id}", async (req) => {
                    const params = req.vars.path;
                    return h22p.response({status: 200, body: `Hello ${params.id}`})
                }),
        };
        const routes = router({...barRoute, ...fooRoute});
        const res = await routes.handle(h22p.get('/resource/123/'))
        expect(res.status).eq(200);
        expect(await Body.text(res.body)).eq('Hello 456');
    })

    describe('generating type-safe client from routing', () => {
        it('read has no body', async () => {
            const routing = {
                getSubId: read<string, { h1: string }>()('GET', "/resource/{id}/sub/{subId}/?q1&q2", async (req) => {
                    const pathParams = req.vars.path;
                    const queryParams = req.vars.query;
                    return h22p.response({
                        status: 200,
                        body: `Hello ${pathParams.id} ${pathParams.subId} ${queryParams.q1} ${queryParams.q2} ${req.headers.h1}`
                    })
                }),
            };

            const {port, close} = await h22p.server(router(routing));
            const contract = contractFrom(routing);

            const readRequest = contract.getSubId({
                path: {id: 'id-123', subId: 'sub-456'},
                query: {q1: "value1", q2: "value2"}
            }, {h1: 'header1'});
            const readResponse = await h22p.client(`http://localhost:${port}`).handle(readRequest);

            expect(readResponse.status).eq(200);
            expect(await Body.text(readResponse.body!)).eq('Hello id-123 sub-456 value1 value2 header1');

            await close();
        })

        it('write string body', async () => {
            const routing = {
                stringRoute: write<string>()('PATCH', "/resource/{id}", async (req) => {
                    const params = req.vars.path;
                    const body = await Body.text(req.body);
                    return h22p.response({status: 200, body: `Hello ${params.id} ${body.length} chars`})
                })
            };

            const {port, close} = await h22p.server(router(routing));
            const contract = contractFrom(routing);

            const stringRequest = contract.stringRoute({path: {id: 'id-123'}}, 'string-123');
            const stringRouteResponse = await h22p.client(`http://localhost:${port}`).handle(stringRequest);

            const stringRouteInMemoryRequest = contract.stringRoute({path: {id: 'id-123'}}, 'string-123');
            const stringRouteResponseInMemory = await routing.stringRoute.handler.handle(stringRouteInMemoryRequest);

            expect(stringRouteResponse.status).eq(200);
            expect(await Body.text(stringRouteResponse.body!)).eq('Hello id-123 10 chars');

            // in memory is the same contract
            expect(stringRouteResponseInMemory.status).eq(200);
            expect(await Body.text(stringRouteResponseInMemory.body!)).eq('Hello id-123 10 chars');

            await close();
        });

        it('write json body', async () => {
            const routing = {
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
            };

            const {port, close} = await h22p.server(router(routing));
            const contract = contractFrom(routing);

            const jsonRequest = contract.jsonRoute({path: {id: 'id-123'}}, {foo: 'body-456'}, {h2: 'thing'});
            const jsonResponse = await h22p.client(`http://localhost:${port}`).handle(jsonRequest);

            const jsonRequestInMemory = contract.jsonRoute({path: {id: 'id-123'}}, {foo: 'body-456'}, {h2: 'thing'});
            const jsonResponseInMemory = await h22p.client(`http://localhost:${port}`).handle(jsonRequestInMemory);

            expect(jsonResponse.status).eq(200);
            expect(await Body.text(jsonResponse.body!)).eq('Hello id-123 body-456');

            expect(jsonResponseInMemory.status).eq(200);
            expect(await Body.text(jsonResponseInMemory.body!)).eq('Hello id-123 body-456');

            await close();
        })

        it('write stream body; h22pStream preserves type in stream', async () => {
            const routing = {
                streamRoute: write<stream.Readable, any, { h3: string[] }>()('PUT', "/resource/{id}", async (req) => {
                    const params = req.vars.path;
                    const body = await Body.text(req.body);
                    // body has no type here, it's just a stream
                    //   but if you know what the type will be then use an h22pStream like below
                    return h22p.response({status: 200, body: `Hello ${params.id} ${body}`})
                }),
                h22pStreamRoute: write<h22pStream<{ foo: string }>>()('POST', "/resource/{id}", async (req) => {
                    const params = req.vars.path;
                    const body = await Body.json(req.body);
                    return h22p.response({status: 200, body: `Hello ${params.id} ${body.foo}`});
                }),
            };

            const {port, close} = await h22p.server(router(routing));
            const contract = contractFrom(routing);


            const streamRequest = contract.streamRoute({path: {id: 'id-123'}}, stream.Readable.from('stream-123'), {h3: ['foo']});
            const streamRouteResponse = await h22p.client(`http://localhost:${port}`).handle(streamRequest);

            const streamRequestInMemory = contract.streamRoute({path: {id: 'id-123'}}, stream.Readable.from('stream-123'), {h3: ['foo']});
            const streamRouteResponseInMemory = await h22p.client(`http://localhost:${port}`).handle(streamRequestInMemory);

            const h22pStreamRequest = contract.h22pStreamRoute({path: {id: 'id-123'}}, {foo: '123'});
            const h22pStreamRouteResponse = await h22p.client(`http://localhost:${port}`).handle(h22pStreamRequest);

            const h22pStreamRequestInMemory = contract.h22pStreamRoute({path: {id: 'id-123'}}, {foo: '123'});
            const h22pStreamRouteResponseInMemory = await h22p.client(`http://localhost:${port}`).handle(h22pStreamRequestInMemory);

            expect(streamRouteResponse.status).eq(200);
            expect(await Body.text(streamRouteResponse.body!)).eq('Hello id-123 stream-123');
            expect(streamRouteResponseInMemory.status).eq(200);
            expect(await Body.text(streamRouteResponseInMemory.body!)).eq('Hello id-123 stream-123');

            expect(h22pStreamRouteResponse.status).eq(200);
            expect(await Body.text(h22pStreamRouteResponse.body!)).eq('Hello id-123 123');
            expect(h22pStreamRouteResponseInMemory.status).eq(200);
            expect(await Body.text(h22pStreamRouteResponseInMemory.body!)).eq('Hello id-123 123');

            await close();
        })

        it('pipe h22pStream stream body', async () => {
            const routing = {
                h22pStreamRoute: write<h22pStream<{ foo: string }>>()('POST', "/resource/{id}", async (req) => {
                    // simply pipe the body through
                    return h22p.response({status: 200, body: req.body})
                }),
            };

            const {port, close} = await h22p.server(router(routing));
            const contract = contractFrom(routing);

            const h22pStreamRequest = contract.h22pStreamRoute({path: {id: 'id-123'}}, {foo: '123'});
            const h22pStreamRouteResponse = await h22p.client(`http://localhost:${port}`).handle(h22pStreamRequest);

            const h22pStreamRequestInMemory = contract.h22pStreamRoute({path: {id: 'id-123'}}, {foo: '123'});
            const h22pStreamRouteResponseInMemory = await h22p.client(`http://localhost:${port}`).handle(h22pStreamRequestInMemory);

            expect(h22pStreamRouteResponse.status).eq(200);
            expect(await Body.text(h22pStreamRouteResponse.body!)).eq('{"foo":"123"}');
            expect(h22pStreamRouteResponseInMemory.status).eq(200);
            expect(await Body.text(h22pStreamRouteResponseInMemory.body!)).eq('{"foo":"123"}');

            await close();
        })

    })
})
