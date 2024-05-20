import {expect} from "chai";
import {Body, get, h22p, h22pStream, HttpMessageBody, post, router} from "../src";
import stream from "stream";
import {doesNotTypeCheck} from "./helpers";

// todo put, patch etc
//  - some good name for them? put them in h22p.static ?
//  open api docs based off routes
//    - how do we do responses :S
//  move the old router tests over still some edge cases to test
//    - like matching on headers and query exactly if they're supplied;
//    - should body parameter be optional because we aren't matching on it; or should we match on it ?


describe('test', () => {
    describe('type-safe routing', () => {
        const routes = {
            getResource: get('/resource/{id}/sub/{subId}?q1&q2', {
                handle: async (req) => {
                    try {
                        const s = await Body.json(req.body);
                        // @ts-expect-error - there is no .foo on undefined body
                        s.foo
                    } catch (e) {
                        // SyntaxError: Unexpected end of JSON input
                    }
                    return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
                }
            }, {"content-type": "text/csv"} as const),
            postJsonResource: post('/resource/{id}', {foo: {baz: 'json'}}, {
                handle: async (req) => {
                    const s = await Body.json(req.body);
                    s.foo.baz
                    return {status: 200, body: {quux: 'json'}, headers: {}}
                }
            }),
            postStringResource: post('/resource/{id}', '', {
                handle: async (req) => {
                    const s = await Body.text(req.body);
                    s.slice
                    return {status: 200, body: 'some response string', headers: {}}
                }
            }),
            postStreamResource: post('/resource/{id}', stream.Readable.from(''), {
                handle: async (req) => {
                    const s = await Body.json(req.body);
                    // @ts-expect-error - I can't preserve a stream type and an h22pStream type cos theyre both stream.Readable ;(
                    s.read

                    return {status: 200, body: stream.Readable.from('123'), headers: {}}
                }
            }),
            postH22pStreamResource: post('/resource/{id}', h22pStream.of({"a": 123}), {
                handle: async (req) => {
                    const s = await Body.json(req.body);
                    s.a

                    return {status: 200, body: stream.Readable.from('123'), headers: {}}
                }
            }),
        };

        it('handle an in-memory type-safe request and response', async () => {
            const response = await routes.getResource.handler.handle({
                method: 'GET',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                body: undefined,
                headers: {"content-type": "text/csv"},
            });
            response.body.bar
            // @ts-expect-error -- foo does not exist on type body
            response.body.foo

            // status comes through exactly typed i.e. 200
            // typeChecks(true as (typeof response.status extends 200 ? true : false));
            doesNotTypeCheck(false as (typeof response.status extends 201 ? true : false));

            response.headers.foo
            // @ts-expect-error -- foo does not exist on type body
            response.headers.bar
        })

        it('build a type-safe request', async () => {
            const typeSafeRequest = routes.getResource.request(
                'GET',
                '/resource/123/sub/456?q1=v1&q2=v2',
                undefined,
                {"content-type": "text/csv"}
            );
            expect(typeSafeRequest).deep.eq({
                "body": undefined,
                "headers": {
                    "content-type": "text/csv",
                },
                "method": "GET",
                "uri": "/resource/123/sub/456?q1=v1&q2=v2"
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
                '/resource/123/sub/456?q1=v1&q2=v2',
                // we should be @ts-expect-error 'ing for a body when we want undefined
                // but for some reason TS think it's an unused @ts-expect-error ....
                // @ts-ignore
                {foo: {bar: 123}},
                {"content-type": "text/csv"}
            );
            const emptyHeaders = routes.getResource.request(
                'GET',
                '/resource/123/sub/456?q1=v1&q2=v2',
                undefined,
                // @ts-expect-error
                {}
            );
            const wrongHeaders = routes.getResource.request(
                'GET',
                '/resource/123/sub/456?q1=v1&q2=v2',
                undefined,
                // @ts-expect-error
                {"content-type": "text/html"}
            );
        });

        it('handle json body', async () => {
            await routes.postJsonResource.handler.handle({
                method: 'POST',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                // @ts-expect-error -- not a string body
                body: {foo: {bar: 'json'}},
                headers: {"content-type": "text/csv"},
            });
            const response = await routes.postJsonResource.handler.handle({
                method: 'POST',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                body: {foo: {baz: 'json'}},
                headers: {"content-type": "text/csv"},
            });
            response.body.quux
            // @ts-expect-error -- foo does not exist on type body
            response.body.foo
        });

        it('handle string body', async () => {
            await routes.postStringResource.handler.handle({
                method: 'POST',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                // @ts-expect-error -- not a string body
                body: {foo: {bar: 'json'}},
                headers: {"content-type": "text/csv"},
            });
            const response = await routes.postStringResource.handler.handle({
                method: 'POST',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                // @ts-expect-error -- not a string body
                body: 'any thing',
                headers: {"content-type": "text/csv"},
            });
            response.body.slice
            // @ts-expect-error -- foo does not exist on type body
            response.body.foo
        });

        it('handle stream body', async () => {
            await routes.postStreamResource.handler.handle({
                method: 'POST',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                // @ts-expect-error -- not a stream body
                body: '{"a": 123}',
                headers: {"content-type": "text/csv"},
            });
            const response = await routes.postStreamResource.handler.handle({
                method: 'POST',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                body: stream.Readable.from('{"a": 123}'),
                headers: {"content-type": "text/csv"},
            });
            response.body.read
            // @ts-expect-error -- foo does not exist on type body
            response.body.foo
        });

        it('wildcard match', async () => {
            const routes = {
                wildcard: get('*/resource/{id}/sub/{subId}/*', {
                    handle: async (req) => {
                        const wildcards = req.vars?.wildcards;
                        return {status: 200, body: `wildcards: ${wildcards?.join(' ')}`, headers: {"foo": "bar"}}
                    }
                })
            }
            const r = router(routes);

            const resp = await r.handle({
                method: 'GET',
                uri: 'stuff/before/resource/123/sub/456/stuff/after',
                body: undefined,
                headers: {},
            });

            expect(resp.body).eq('wildcards: stuff/before stuff/after')

            await routes.wildcard.handler.handle({
                method: 'GET',
                // doesn't need to have stuff before and after to match
                uri: '/resource/123/sub/456/',
                body: undefined,
                headers: {},
            });

            await routes.wildcard.handler.handle({
                method: 'GET',
                // @ts-expect-error - but does need to fulfil the basic contract
                uri: '/resource/123/sub',
                body: undefined,
                headers: {},
            });
        })
    })

    describe('routing logic of router', () => {
        it('not found default', async () => {
            const r = router({
                getResource: get('/resource', {
                    handle: async (req) => {
                        return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
                    }
                }, {"content-type": "text/csv"} as const)
            });
            const res = await r.handle(h22p.request({method: 'GET', uri: '/not/found'}))
            expect(res.status).eq(404);
            expect(await Body.text(res.body)).eq('Not found');
        })

        it('simple route', async () => {
            const r = router({
                getResource: get('/', {
                    handle: async (req) => {
                        return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
                    }
                }, {"content-type": "text/csv"} as const)
            });
            const res = await r.handle(h22p.request({method: 'GET', uri: '/'}))
            expect(res.status).eq(200);
            expect(await Body.text(res.body)).eq(`{"bar":"json"}`);
        })

        it('path param', async () => {
            const rs = {
                getResource: get('/resource/{id}/sub/{subId}?q1&q2', {
                    handle: async (req) => {
                        const path = req.vars?.path;
                        return {status: 200, body: `Hello ${path?.id} ${path?.subId}`, headers: {"foo": "bar"}}
                    }
                }, {"content-type": "text/csv"} as const)
            };
            const r = router(rs);
            const res = await r.handle(h22p.get('/resource/123/sub/456'))
            expect(res.status).eq(200);
            expect(await Body.text(res.body)).eq('Hello 123 456');
        })
    })

    it('produces openAPI spec', async () => {
        const routes = {
            getResource: get('/users/{userId}?q1&q2', {
                    handle: async (req) => {
                        const u = req.uri
                        if (u.length > 5) {
                            return h22p.ok({body: 'hello'})
                        } else {
                            return h22p.notFound();
                        }
                    }
                }, {"content-type": "text/plain"} as const,
                // TODO why does it care about the Body type but not the Headers or Status ??
                [
                    h22p.ok({body: 'string', headers: {"content-type": "text/plain"}}),
                    h22p.notFound({body: 'string', headers: {"content-type": "text/plain"}}),
                ]),
            postResource: post('/users/{userId}?q1&q2', {example: 'payload'}, {
                    handle: async (req) => {
                        const u = req.uri
                        if (u.length > 5) {
                            return h22p.ok({body: 'hello'})
                        } else {
                            return h22p.notFound();
                        }
                    }
                }, {"content-type": "text/plain"} as const,
                // TODO why does it care about the Body type but not the Headers or Status ??
                [
                    h22p.ok({body: 'string', headers: {"content-type": "text/plain"}}),
                    h22p.notFound({body: 'string', headers: {"content-type": "text/plain"}}),
                ]),
        }

        // TODO make this blow up even if query string provided (it's being interpreted as path parameter!)

        const foo = await routes.getResource.handler.handle({
            method: 'GET',
            uri: '/users/123?q1=v1&q2=v2',
            body: undefined,
            headers: {"content-type": 'text/plain'}
        })

        if (foo.status === 200) {
            // Todo make this not compile ;(
            foo.body
        }

        expect(openApiSchema(routes)).deep.eq(output())

        type SchemaType = {
            "type": "string" | "integer" | "object" | "array" | "boolean" | "binary"
        };
        type OpenapiParameter = {
            "name": string // "userId",
            "in": "path" | "query" | "header" | "cookie", // "path"
            "required": boolean, // path parameters are always required
            "description": string // "ID of the user to retrieve",
            "schema": SchemaType
        };

        type OpenapiResponses = {
            [statusCode: string]: {
                "description": string, // "A user object",
                "content": {
                    [contentType: string]: { // "application/json"
                        "schema": {
                            "$ref"?: string // "#/components/schemas/User"
                            type?: SchemaType['type']; // string
                            format?: "binary" | "int32" | "int64" | "date" | string // binary
                        }
                    }
                }
            }
        };
        type Resource = {
            summary: string; // "Get a user by ID",
            operationId: string; // "getUserById",
            "tags": string[],  // ["Users"],
            "parameters": OpenapiParameter[],
            "responses": OpenapiResponses

        };
        type OpenApiSchema = {
            "openapi": "3.0.3",
            "info": {
                "title": string, // "Example API"
                "description": string, // "This is a sample API to demonstrate OpenAPI documentation."
                "version": string, // "1.0.0"
            },
            "servers": [
                {
                    "url": string, // "https://api.example.com/v1",
                    "description": string, // "Production server"
                }
            ],
            paths: {
                [path: string]: {
                    [mtd: string]: Resource
                }
            }
        };

        function openApiSchema(rs: typeof routes): OpenApiSchema {
            const routes = Object.values(rs);
            const metadata = {
                "openapi": "3.0.3",
                "info": {
                    "description": "This is a sample API to demonstrate OpenAPI documentation.",
                    "title": "Example API",
                    "version": '1.0.0', // "1.0.0"
                },
                "servers": [
                    {
                        "url": 'http://localhost:3000', // "https://api.example.com/v1",
                        "description": 'local server', // "Production server"
                    }
                ], paths: {}
            };
            return routes.reduce((acc, next) => {
                const uri: string = next.matcher.uri.split("?")[0];
                const paths = acc.paths;
                const method = next.matcher.method;
                const responses = next.responses;
                const definition = {
                    summary: 'summary',
                    operationId: 'operationId',
                    "tags": [],
                    "parameters": [
                        {
                            "name": "userId",
                            "in": "path", //  | "query" | "header" | "cookie", // "path"
                            "required": true, // path parameters are always required
                            "description": "ID of the user to retrieve", // "ID of the user to retrieve",
                            "schema": {type: "string"}
                        }
                    ] as OpenapiParameter[],
                    "responses": responses.reduce((acc, r) => {
                        const header = r.headers['content-type'] as string | undefined;
                        acc
                            [r.status.toString()] = {
                            description: r.statusText ?? '',
                            content: {
                                [header ?? contentTypeHeaderFromBody(r.body)]: {
                                    schema: {
                                        type: contentTypeFromBody(r.body)
                                    }
                                }
                            }

                        }

                        return acc;
                    }, {} as OpenapiResponses)
                };
                if (paths[uri] === undefined) {
                    paths[uri] = {
                        [method]: definition
                    }
                } else {
                    paths[uri][method] = definition
                }
                return acc;
            }, metadata as OpenApiSchema)
        }

        function contentTypeFromBody(body: HttpMessageBody): SchemaType['type'] {
            return typeof body === 'string'
                ? 'string' : typeof body === 'object'
                    ? 'object' : 'binary'
        }


        function contentTypeHeaderFromBody(body: HttpMessageBody): string {
            return typeof body === 'string'
                ? 'text/plain' : typeof body === 'object'
                    ? 'application/json' : 'application/octet-stream'
        }

        function output() {
            return {
                "openapi": "3.0.3",
                "info": {
                    "title": "Example API",
                    "description": "This is a sample API to demonstrate OpenAPI documentation.",
                    "version": "1.0.0"
                },
                "servers": [
                    {
                        "url": "https://api.example.com/v1",
                        "description": "Production server"
                    }
                ],
                "paths": {
                    "/users/{userId}": {
                        "get": {
                            "summary": "Summary",
                            "operationId": "getResource",
                            "tags": [],
                            "parameters": [
                                {
                                    "name": "userId",
                                    "in": "path",
                                    "required": true,
                                    "description": "ID of the user to retrieve",
                                    "schema": {
                                        "type": "string"
                                    }
                                }
                            ],
                            "responses": {
                                "200": {
                                    "description": "A user object",
                                    "content": {
                                        "text/plain": {
                                            "schema": {
                                                "$ref": "$ref",
                                                "format": "string",
                                                "type": "string"
                                            }
                                        }
                                    }
                                },
                                "404": {
                                    "content": {
                                        "text/plain": {
                                            "schema": {
                                                "type": "string"
                                            }
                                        }
                                    },
                                    "description": "User not found"
                                }
                            }
                        },
                        "post": {
                            "summary": "Summary",
                            "operationId": "postResource",
                            "tags": [],
                            "parameters": [
                                {
                                    "name": "userId",
                                    "in": "path",
                                    "required": true,
                                    "description": "ID of the user to delete",
                                    "schema": {
                                        "type": "string"
                                    }
                                }
                            ],
                            "responses": {
                                "204": {
                                    "description": "User deleted successfully"
                                },
                                "404": {
                                    "content": {
                                        "text/plain": {
                                            "schema": {
                                                "type": "string"
                                            }
                                        }
                                    },
                                    "description": "User not found"
                                }
                            }
                        }
                    }
                },
            }
        }
    })
})
