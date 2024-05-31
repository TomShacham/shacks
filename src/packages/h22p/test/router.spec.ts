import {expect} from "chai";
import {Body, h22pStream, Req, Res, Route, Router} from "../src";
import stream from "stream";
import {doesNotTypeCheck} from "./helpers";

describe('router', () => {
    describe('type-safe routing', () => {
        const routes = {
            getResource: Route.get('/resource/{id}/sub/{subId}?q1&q2', async (req) => {
                    try {
                        const s = await Body.json(req.body);
                        // @ts-expect-error - there is no .foo on undefined body
                        s.foo
                    } catch (e) {
                        // SyntaxError: Unexpected end of JSON input
                    }
                    return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
                }
                , {"content-type": "text/csv"} as const),
            postJsonResource: Route.post('/resource/{id}', {foo: {baz: 'json'}}, async (req) => {
                    const s = await Body.json(req.body);
                    s.foo.baz
                    return {status: 200, body: {quux: 'json'}, headers: {}}
                }
            ),
            postStringResource: Route.post('/resource/{id}', '', async (req) => {
                    const s = await Body.text(req.body);
                    s.slice
                    return {status: 200, body: 'some response string', headers: {}}
                }
            ),
            postStreamResource: Route.post('/resource/{id}', stream.Readable.from(''), async (req) => {
                    const s = await Body.json(req.body);
                    // @ts-expect-error - I can't preserve a stream type and an h22pStream type cos theyre both stream.Readable ;(
                    s.read

                    return {status: 200, body: stream.Readable.from('123'), headers: {}}
                }
            ),
            postH22pStreamResource: Route.post('/resource/{id}', h22pStream.of({"a": 123}), async (req) => {
                    const s = await Body.json(req.body);
                    s.a

                    return {status: 200, body: stream.Readable.from('123'), headers: {}}
                }
            ),
        };

        it('handle an in-memory type-safe request and response', async () => {
            const response = await routes.getResource.handle(Req.get(
                '/resource/123/sub/456/?q1=v1&q2=v2',
                {"content-type": "text/csv"},
            ));
            response.body.bar
            // @ts-expect-error -- foo does not exist on type body
            response.body.foo

            // status comes through exactly typed i.e. 200
            // TODO make this compile
            // typeChecks(true as (typeof response.status extends 200 ? true : false));
            doesNotTypeCheck(false as (typeof response.status extends 201 ? true : false));

            response.headers.foo
            // @ts-expect-error -- foo does not exist on type body
            response.headers.bar
        })

        it('build a type-safe request', async () => {
            const typeSafeRequest = routes.getResource.request(
                'GET',
                '/resource/123/sub/456/?q1=v1&q2=v2',
                undefined,
                {"content-type": "text/csv"}
            );
            expect(typeSafeRequest).deep.eq({
                "body": undefined,
                "headers": {
                    "content-type": "text/csv",
                },
                "method": "GET",
                "uri": "/resource/123/sub/456/?q1=v1&q2=v2"
            })

            /*
                --- expect errors in the below to prove we are type-safe ---
             */

            const wrongPathProvided = routes.getResource.request(
                'GET',
                // @ts-expect-error
                '/resource/123/sub?q1=v1&q2=v2',
                undefined,
                {"content-type": "text/csv"}
            );
            const noQueryProvided = routes.getResource.request(
                'GET',
                // @ts-expect-error
                '/resource/123/sub/456',
                undefined,
                {"content-type": "text/csv"}
            );
            const wrongMethod = routes.getResource.request(
                // @ts-expect-error
                'POST',
                '/resource/123/sub?q1=v1&q2=v2',
                undefined,
                {"content-type": "text/csv"}
            );
            const wrongUri = routes.getResource.request(
                'GET',
                // @ts-expect-error
                '/resource/123/sub?q1=v1&q2=v2',
                undefined,
                {"content-type": "text/csv"}
            );
            const wrongBody = routes.getResource.request(
                'GET',
                '/resource/123/sub/456/?q1=v1&q2=v2',
                // we should be @ts-expect-error 'ing for a body when we want undefined
                // but for some reason TS think it's an unused @ts-expect-error ....
                // @ts-ignore
                {foo: {bar: 123}},
                {"content-type": "text/csv"}
            );
            const emptyHeaders = routes.getResource.request(
                'GET',
                '/resource/123/sub/456/?q1=v1&q2=v2',
                undefined,
                // @ts-expect-error
                {}
            );
            const wrongHeaders = routes.getResource.request(
                'GET',
                '/resource/123/sub/456/?q1=v1&q2=v2',
                undefined,
                // @ts-expect-error
                {"content-type": "text/html"}
            );
        });

        it('handle json body', async () => {
            await routes.postJsonResource.handle({
                method: 'POST',
                uri: '/resource/123/',
                // @ts-expect-error -- not a string body
                body: {foo: {bar: 'json'}},
                headers: {"content-type": "text/csv"},
            });
            const response = await routes.postJsonResource.handle(Req.post(
                '/resource/123/',
                {foo: {baz: 'json'}},
                {"content-type": "text/csv"},
            ));
            response.body.quux
            // @ts-expect-error -- foo does not exist on type body
            response.body.foo
        });

        it('handle string body', async () => {
            await routes.postStringResource.handle({
                method: 'POST',
                uri: '/resource/123/',
                // @ts-expect-error -- not a string body
                body: {foo: {bar: 'json'}},
                headers: {"content-type": "text/csv"},
            });
            const response = await routes.postStringResource.handle({
                method: 'POST',
                uri: '/resource/123/',
                // @ts-expect-error -- not a string body
                body: 'any thing',
                headers: {"content-type": "text/csv"},
            });
            response.body.slice
            // @ts-expect-error -- foo does not exist on type body
            response.body.foo
        });

        it('handle stream body', async () => {
            await routes.postStreamResource.handle({
                method: 'POST',
                uri: '/resource/123/',
                // @ts-expect-error -- not a stream body
                body: '{"a": 123}',
                headers: {"content-type": "text/csv"},
            });
            const response = await routes.postStreamResource.handle(Req.post(
                '/resource/123/',
                stream.Readable.from('{"a": 123}'),
                {"content-type": "text/csv"}
            ))
            response.body.read
            // @ts-expect-error -- foo does not exist on type body
            response.body.foo
        });

        it('wildcard match', async () => {
            const routes = {
                wildcard: Route.get('*/resource/{id}/sub/{subId}/*', async (req) => {
                        const wildcards = req.vars?.wildcards;
                        return {status: 200, body: `wildcards: ${wildcards?.join(' ')}`, headers: {"foo": "bar"}}
                    }
                )
            }
            const r = Router.of(routes);

            const resp = await r.handle(Req.get('stuff/before/resource/123/sub/456/stuff/after/'));

            expect(resp.body).eq('wildcards: stuff/before stuff/after')

            // can have anything in the place of the wildcard
            await routes.wildcard.handle(Req.get('abc/resource/123/sub/456/def'));

            // but doesn't need to have anything in place of the wildcard
            await routes.wildcard.handle({
                method: 'GET',
                uri: '/resource/123/sub/456/',
                body: undefined,
                headers: {},
            });

            // but does need to fulfil the basic contract
            await routes.wildcard.handle({
                method: 'GET',
                // @ts-expect-error
                uri: '/resource/123/sub',
                body: undefined,
                headers: {},
            });

        })

        it('can perform type narrow of responses', async () => {
            const routes = {
                postUser: Route.post('/users/{userId}', {example: 'payload'}, async (req) => {
                        if (Math.random() > 0.5) {
                            return Res.created({body: {user: {name: 'tom', worksAt: 'Evil Corp'}}})
                        } else {
                            return Res.notFound();
                        }
                    }
                    , {"content-type": "application/json"} as const,
                    [
                        Res.created({
                            body: {user: {name: 'tom', worksAt: 'Evil Corp', employed: true, yearsExperience: 10}},
                            headers: {"content-type": "application/json"},
                        }),
                        Res.notFound({headers: {"content-type": "text/plain"}}),
                    ])
            }

            const foo = await routes.postUser.handle(Req.post(
                '/users/123/',
                {example: 'payload'},
                {"content-type": 'application/json'}
            ))
            if (foo.status === 200) {
                // Todo make this compile ;(
                // @ts-expect-error
                foo.body.user
            }
        })
    })

    describe('routing logic of router', () => {
        it('not found default', async () => {
            const r = Router.of({
                getResource: Route.get('/resource', async (req) => {
                        return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
                    }
                    , {"content-type": "text/csv"} as const)
            });
            const res = await r.handle(Req.get('/not/found/'))
            expect(res.status).eq(404);
            expect(await Body.text(res.body)).eq('Not found');
        })

        it('simple route', async () => {
            const r = Router.of({
                getResource: Route.get('/', async (req) => {
                        return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
                    }
                    , {"content-type": "text/csv"} as const)
            });
            const res = await r.handle(Req.get('/'))
            expect(res.status).eq(200);
            expect(await Body.text(res.body)).eq(`{"bar":"json"}`);
        })

        it('path param', async () => {
            const rs = {
                getResource: Route.get('/resource/{id}/sub/{subId}', async (req) => {
                        const path = req.vars.path;
                        return {status: 200, body: `Hello ${path?.id} ${path?.subId}`, headers: {"foo": "bar"}}
                    }
                    , {"content-type": "text/csv"} as const)
            };
            const r = Router.of(rs);
            const res = await r.handle(Req.get('/resource/123/sub/456/'))
            expect(res.status).eq(200);
            expect(await Body.text(res.body)).eq('Hello 123 456');
        })

        it('wildcard with values', async () => {
            const rs = {
                getResource: Route.get('*/resource/*/sub/{subId}/*', async (req) => {
                        const wilds = req.vars?.wildcards.join(' - ');
                        return {status: 200, body: wilds, headers: {"foo": "bar"}}
                    }
                    , {"content-type": "text/csv"} as const)
            };
            const r = Router.of(rs);
            const res = await r.handle(Req.get('/a/b/c/resource/d/e/f/sub/456/g/h/i/'))
            expect(res.status).eq(200);
            expect(await Body.text(res.body)).eq('/a/b/c - d/e/f - g/h/i');
        })

        it('wildcard without values', async () => {
            const rs = {
                getResource: Route.get('*/resource/*', async (req) => {
                        const wilds = req.vars?.wildcards.join(' - ');
                        return {status: 200, body: wilds, headers: {"foo": "bar"}}
                    }
                    , {"content-type": "text/csv"} as const)
            };
            const r = Router.of(rs);
            const res = await r.handle(Req.get('/resource/'))
            expect(res.status).eq(200);
            expect(await Body.text(res.body)).eq(' - ');
        })

        it('wildcard with query and path params and fragment', async () => {
            const rs = {
                getResource: Route.get('*/resource/*/{id}/?q1', async (req) => {
                        const wilds = req.vars?.wildcards.join(' - ');
                        const pathId = req.vars?.path.id;
                        const q1 = req.vars?.query.q1;
                        return {status: 200, body: `${pathId} ${q1} ${wilds}`, headers: {"foo": "bar"}}
                    }
                    , {"content-type": "text/csv"} as const)
            };
            const r = Router.of(rs);
            const res = await r.handle(Req.get('/resource/some/path/id-123/?q1=v1#frag'))
            expect(res.status).eq(200);
            expect(await Body.text(res.body)).eq('id-123 v1  - some/path');
        })

        it('if query params with "!" are in route then they need to be provided to match (in any order)', async () => {
            const rs = {
                getResource: Route.get('/resource/{id}/?q1&q2!', async (req) => {
                        const pathId = req.vars?.path.id;
                        const queries = Object.values(req.vars?.query ?? {}).join('&');
                        return {status: 200, body: `${pathId} ${queries}`, headers: {"foo": "bar"}}
                    }
                    , {"content-type": "text/csv"} as const)
            };
            const r = Router.of(rs);
            const notFound = await r.handle(Req.get('/resource/id-123/?q1=v1'))
            expect(notFound.status).eq(404);
            expect(await Body.text(notFound.body)).eq('Not found');

            // and query can be in any order
            const found = await r.handle(Req.get('/resource/id-123/?q2=v2&q1=v1'))
            expect(found.status).eq(200);
            expect(await Body.text(found.body)).eq('id-123 v2&v1');

            // and query can be in any order
            const foundWithoutQ1 = await r.handle(Req.get('/resource/id-123/?q2=v2'))
            expect(foundWithoutQ1.status).eq(200);
            expect(await Body.text(foundWithoutQ1.body)).eq('id-123 v2');
        });

        it('missing the trailing slash on a route still matches a path with a slash', async () => {
            const r = Router.of({
                getResource: Route.get('/resource', async (req) => {
                        return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
                    }
                    , {"content-type": "text/csv"} as const)
            });
            const res = await r.handle(Req.of({method: 'GET', uri: '/resource/'}))
            expect(res.status).eq(200);
            expect(await Body.text(res.body)).eq(`{"bar":"json"}`);
        })

        it('missing the trailing slash on the request still matches a route with a slash', async () => {
            const r = Router.of({
                getResource: Route.get('/resource/', async (req) => {
                        return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
                    }
                    , {"content-type": "text/csv"} as const)
            });
            const res = await r.handle(Req.of({method: 'GET', uri: '/resource'}))
            expect(res.status).eq(200);
            expect(await Body.text(res.body)).eq(`{"bar":"json"}`);
        })

        it(`supports all the methods and populates vars when calling a handler directly (i.e. without router providing them)`, async () => {
            const routes = {
                get: Route.get('/id/{id}/*/?q1', async (req) => Res.ok({body: req.vars})),
                head: Route.head('/id/{id}/*/?q1', async (req) => Res.ok({body: req.vars})),
                options: Route.options('/id/{id}/*/?q1', async (req) => Res.ok({body: req.vars})),
                trace: Route.trace('/id/{id}/*/?q1', async (req) => Res.ok({body: req.vars})),
                post: Route.post('/id/{id}/*/?q1', {}, async (req) => Res.ok({body: req.vars})),
                put: Route.put('/id/{id}/*/?q1', {}, async (req) => Res.ok({body: req.vars})),
                patch: Route.patch('/id/{id}/*/?q1', {}, async (req) => Res.ok({body: req.vars})),
                delete: Route.delete('/id/{id}/*/?q1', {}, async (req) => Res.ok({body: req.vars})),
            }

            const get = await routes.get.handle(Req.get('/id/123/wild/?q1=v1'));
            const head = await routes.head.handle(Req.head('/id/123/wild/?q1=v1'));
            const options = await routes.options.handle(Req.options('/id/123/wild/?q1=v1'));
            const trace = await routes.trace.handle(Req.trace('/id/123/wild/?q1=v1'));
            const post = await routes.post.handle(Req.post('/id/123/wild/?q1=v1', {}));
            const put = await routes.put.handle(Req.put('/id/123/wild/?q1=v1', {}));
            const patch = await routes.patch.handle(Req.patch('/id/123/wild/?q1=v1', {}));
            const del = await routes.delete.handle(Req.delete('/id/123/wild/?q1=v1', {}));

            expect(await Body.json(get.body)).deep.eq({
                path: {"id": "123"}, query: {"q1": "v1"}, wildcards: ["wild"]
            });
            expect(await Body.json(get.body)).deep.eq({
                path: {"id": "123"}, query: {"q1": "v1"}, wildcards: ["wild"]
            });
            expect(await Body.json(head.body)).deep.eq({
                path: {"id": "123"}, query: {"q1": "v1"}, wildcards: ["wild"]
            });
            expect(await Body.json(options.body)).deep.eq({
                path: {"id": "123"}, query: {"q1": "v1"}, wildcards: ["wild"]
            });
            expect(await Body.json(trace.body)).deep.eq({
                path: {"id": "123"}, query: {"q1": "v1"}, wildcards: ["wild"]
            });
            expect(await Body.json(post.body)).deep.eq({
                path: {"id": "123"}, query: {"q1": "v1"}, wildcards: ["wild"]
            });
            expect(await Body.json(put.body)).deep.eq({
                path: {"id": "123"}, query: {"q1": "v1"}, wildcards: ["wild"]
            });
            expect(await Body.json(patch.body)).deep.eq({
                path: {"id": "123"}, query: {"q1": "v1"}, wildcards: ["wild"]
            });
        });

    })

})
